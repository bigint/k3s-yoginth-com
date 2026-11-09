import { headers } from "next/headers";
import Link from "next/link";
import type { ReactNode } from "react";
import { getPeers, type Peer } from "@/lib/peers";

export const dynamic = "force-dynamic";

const GIGABYTE = 1024 ** 3;
const MEGABYTE = 1024 ** 2;

const sectionLabelClassName =
  "text-[0.8125rem] font-semibold tracking-wide text-muted";

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

const formatGigabytes = (bytes: number): string =>
  `${(bytes / GIGABYTE).toFixed(1)} GiB`;

const formatMegabytes = (bytes: number): string =>
  `${Math.round(bytes / MEGABYTE)} MiB`;

interface RowProps {
  label: string;
  value: ReactNode;
}

const Row = ({ label, value }: RowProps) => {
  return (
    <div className="flex flex-wrap justify-between gap-x-6 border-t border-muted/20 py-2 first:border-t-0">
      <dt className="text-muted">{label}</dt>
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
    <section className="mt-10">
      <h2 className={sectionLabelClassName}>{title}</h2>
      <dl className="mt-2">{children}</dl>
    </section>
  );
};

interface DetailsProps {
  peer: Peer;
}

const Details = ({ peer }: DetailsProps) => {
  const { info } = peer;
  const used = info.memory.systemTotal - info.memory.systemFree;
  const limit = info.memory.processLimit;

  return (
    <>
      <Group title="Node">
        <Row label="Name" value={info.node} />
        <Row label="Location" value={info.location ?? "Unknown"} />
        <Row label="Uptime" value={formatDuration(info.uptime.system)} />
        <Row label="CPU" value={`${info.cpuCount} × ${info.cpuModel}`} />
        <Row
          label="Load (1, 5, 15 min)"
          value={info.loadAverage.map((load) => load.toFixed(2)).join(", ")}
        />
        <Row
          label="Memory"
          value={`${formatGigabytes(used)} of ${formatGigabytes(info.memory.systemTotal)}`}
        />
      </Group>
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
    </>
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
        <h1 className="text-base font-bold text-heading">k3s</h1>
      </header>

      <div className="flex flex-col gap-5">
        <p>
          Cloudflare sent you to{" "}
          <strong className="font-bold text-heading">{self.info.node}</strong>.
          It picks the nearest connector, so this usually stays the same.
        </p>
        <p>
          Choose a node below to see its details, fetched from it over the
          cluster network.
        </p>
      </div>

      <section className="mt-10">
        <h2 className={sectionLabelClassName}>Nodes</h2>
        <nav aria-label="Nodes" className="mt-2">
          {peers.map((peer) => {
            const isCurrent = peer.info.node === selected.info.node;
            return (
              <Link
                aria-current={isCurrent ? "page" : undefined}
                className={`flex flex-wrap justify-between gap-x-6 border-t border-muted/20 py-2 no-underline first:border-t-0 ${isCurrent ? "font-bold text-heading" : ""}`}
                href={`/?node=${encodeURIComponent(peer.info.node)}`}
                key={peer.info.node}
                prefetch={false}
              >
                <span>{peer.info.node}</span>
                <span className="font-normal text-muted">
                  {peer.info.location ?? "Unknown location"}
                </span>
              </Link>
            );
          })}
        </nav>
      </section>

      {isMissing ? (
        <p className="mt-5 text-accent">
          That node isn’t available, so this shows the serving node.
        </p>
      ) : null}
      {unreachable > 0 ? (
        <p className="mt-5 text-accent">
          {unreachable === 1
            ? "1 pod did not respond"
            : `${unreachable} pods did not respond`}
          , so it may be missing from the list.
        </p>
      ) : null}

      <p className="mt-5 text-muted">
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
