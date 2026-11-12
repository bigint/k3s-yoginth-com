import { headers } from "next/headers";
import type { ReactNode } from "react";
import { getNodeInfo, type NodeInfo } from "@/lib/info";

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
  info: NodeInfo;
}

const Details = ({ info }: DetailsProps) => {
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

const Page = async () => {
  const requestHeaders = await headers();
  const info = getNodeInfo();

  const ray = requestHeaders.get("cf-ray");
  const edge = ray?.split("-").pop() ?? null;
  const country = requestHeaders.get("cf-ipcountry");

  return (
    <section className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-5">
      <header className="mb-8">
        <h1 className="font-title text-heading">k3s</h1>
      </header>

      <p>
        Cloudflare sent you to{" "}
        <strong className="font-title text-heading">{info.node}</strong>
        {info.location ? ` (${info.location})` : ""}. It picks the nearest
        connector, so this usually stays the same.
      </p>

      <Details info={info} />

      <Group title="Your request">
        <Row label="Cloudflare edge" value={edge ?? "Not through Cloudflare"} />
        <Row label="Your country" value={country ?? "Unknown"} />
        <Row label="Cloudflare ray" value={ray ?? "None"} />
      </Group>
    </section>
  );
};

export default Page;
