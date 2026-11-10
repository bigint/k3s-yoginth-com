import { headers } from "next/headers";
import Link from "next/link";
import type { ReactNode } from "react";
import { getPeers, type Peer } from "@/lib/peers";

export const dynamic = "force-dynamic";

const MEGABYTE = 1024 ** 2;

const sectionHeadingClassName = "font-title text-heading";

const rowClassName =
  "flex flex-col items-start gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4";

const formatDuration = (seconds: number): string => {
  const days = Math.floor(seconds / 86_400);
  const hours = Math.floor((seconds % 86_400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) {
    return `${days}d ${hours}h`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m ${Math.floor(seconds % 60)}s`;
};

const formatMegabytes = (bytes: number): string =>
  `${Math.round(bytes / MEGABYTE)} MiB`;

interface RowProps {
  label: string;
  value: ReactNode;
}

const Row = ({ label, value }: RowProps) => {
  return (
    <div className={rowClassName}>
      <dt className="shrink-0 text-muted">{label}</dt>
      <dd className="min-w-0 wrap-anywhere tabular-nums">{value}</dd>
    </div>
  );
};

interface GroupProps {
  children: ReactNode;
  title: string;
}

const Group = ({ children, title }: GroupProps) => {
  return (
    <section className="mt-12">
      <h2 className={sectionHeadingClassName}>{title}</h2>
      <dl className="mt-4 flex flex-col gap-5 sm:gap-4">{children}</dl>
    </section>
  );
};

interface DetailsProps {
  peer: Peer;
}

const Details = ({ peer }: DetailsProps) => {
  const { info } = peer;
  const limit = info.memory.processLimit;

  return (
    <Group title="App">
      <Row
        label="Revision"
        value={
          info.revision ? (
            <a
              href={`https://github.com/bigint/k3s-yoginth-com/commit/${info.revision}`}
              rel="noopener noreferrer"
              target="_blank"
            >
              {info.revision.slice(0, 7)}
            </a>
          ) : (
            "Unknown"
          )
        }
      />
      <Row label="Uptime" value={formatDuration(info.uptime.process)} />
      <Row
        label="Memory"
        value={`${formatMegabytes(info.memory.processUsed)}${limit ? ` of ${formatMegabytes(limit)}` : ""}`}
      />
    </Group>
  );
};

interface PageProps {
  searchParams: Promise<{ node?: string | string[] }>;
}

const Page = async ({ searchParams }: PageProps) => {
  const [{ node: requested }, requestHeaders, { peers, self, unreachable }] =
    await Promise.all([searchParams, headers(), getPeers()]);

  const selected = peers.find((peer) => peer.info.node === requested) ?? self;
  const isMissing =
    typeof requested === "string" && selected.info.node !== requested;
  const isSelf = selected.info.node === self.info.node;

  const ray = requestHeaders.get("cf-ray");
  const edge = ray?.split("-").pop() ?? null;
  const country = requestHeaders.get("cf-ipcountry");

  return (
    <section className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-5">
      <header className="mb-8">
        <h1 className="font-title text-heading">k3s</h1>
      </header>

      <div className="flex flex-col gap-5">
        <p>
          Cloudflare sent you to{" "}
          <strong className="font-title text-heading">{self.info.node}</strong>.
          It picks the nearest connector, so this usually stays the same.
        </p>
        <p>
          Choose a node below to see its details, fetched from it over the
          cluster network.
        </p>
      </div>

      <nav aria-labelledby="nodes-heading" className="mt-14">
        <h2 className={sectionHeadingClassName} id="nodes-heading">
          Nodes
        </h2>
        <ul className="mt-4 flex flex-col gap-5 sm:gap-4">
          {peers.map((peer) => {
            const isCurrent = peer.info.node === selected.info.node;
            return (
              <li className={rowClassName} key={peer.info.node}>
                <Link
                  aria-current={isCurrent ? "page" : undefined}
                  className="min-w-0 aria-[current=page]:font-title aria-[current=page]:text-heading aria-[current=page]:decoration-current"
                  href={`/?node=${encodeURIComponent(peer.info.node)}`}
                  prefetch={false}
                >
                  {peer.info.node}
                </Link>
                <span className="shrink-0 text-muted">
                  {peer.info.location ?? "Unknown location"}
                </span>
              </li>
            );
          })}
        </ul>
      </nav>

      {isMissing ? (
        <p className="mt-5 text-heading">
          That node isn’t available, so this shows the serving node.
        </p>
      ) : null}
      {unreachable > 0 ? (
        <p className="mt-5 text-heading">
          {unreachable === 1
            ? "1 pod did not respond"
            : `${unreachable} pods did not respond`}
          , so it may be missing from the list.
        </p>
      ) : null}

      <p className="mt-6 text-muted">
        Showing {selected.info.node}
        {isSelf
          ? ", the node serving this page."
          : `, fetched by ${self.info.node} in ${selected.latencyMs} ms.`}
      </p>

      <Details peer={selected} />

      <Group title="Your request">
        <Row label="Cloudflare edge" value={edge ?? "Not through Cloudflare"} />
        <Row label="Your country" value={country ?? "Unknown"} />
        <Row label="Cloudflare ray" value={ray ?? "None"} />
      </Group>
    </section>
  );
};

export default Page;
