import { headers } from "next/headers";
import Link from "next/link";
import { getPeers, type Peer } from "@/lib/peers";

export const dynamic = "force-dynamic";

const GIGABYTE = 1024 ** 3;
const MEGABYTE = 1024 ** 2;

function formatDuration(seconds: number): string {
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
}

function formatGigabytes(bytes: number): string {
  return `${(bytes / GIGABYTE).toFixed(1)} GiB`;
}

function formatMegabytes(bytes: number): string {
  return `${Math.round(bytes / MEGABYTE)} MiB`;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="row">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function Details({ peer }: { peer: Peer }) {
  const { info } = peer;
  const used = info.memory.systemTotal - info.memory.systemFree;
  const limit = info.memory.processLimit;

  return (
    <div className="grid">
      <section>
        <h2>Node</h2>
        <dl>
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
        </dl>
      </section>
      <section>
        <h2>Pod</h2>
        <dl>
          <Row label="Name" value={info.pod ?? "Unknown"} />
          <Row label="Namespace" value={info.namespace ?? "Unknown"} />
          <Row label="Pod IP" value={info.podIp ?? "Unknown"} />
          <Row label="Uptime" value={formatDuration(info.uptime.process)} />
          <Row
            label="Memory"
            value={`${formatMegabytes(info.memory.processUsed)}${limit ? ` of ${formatMegabytes(limit)}` : ""}`}
          />
        </dl>
      </section>
      <section>
        <h2>App</h2>
        <dl>
          <Row
            label="Revision"
            value={
              info.revision ? (
                <a
                  href={`https://github.com/bigint/k3s-yoginth-com/commit/${info.revision}`}
                >
                  {info.revision.slice(0, 7)}
                </a>
              ) : (
                "Unknown"
              )
            }
          />
          <Row label="Node.js" value={info.nodeVersion} />
          <Row label="Platform" value={`${info.platform} ${info.arch}`} />
          <Row label="Node time" value={info.time} />
        </dl>
      </section>
    </div>
  );
}

export default async function Page({
  searchParams
}: {
  searchParams: Promise<{ node?: string | string[] }>;
}) {
  const [{ node: requested }, requestHeaders, { peers, self, unreachable }] =
    await Promise.all([searchParams, headers(), getPeers()]);

  const serving = self;
  const selected =
    peers.find((peer) => peer.info.node === requested) ?? serving;
  const notFound =
    typeof requested === "string" && selected.info.node !== requested;

  const ray = requestHeaders.get("cf-ray");
  const edge = ray?.split("-").pop() ?? null;
  const country = requestHeaders.get("cf-ipcountry");

  return (
    <main>
      <p className="label">Cloudflare sent you to</p>
      <h1>{serving.info.node}</h1>
      <p className="note">
        Cloudflare picks the nearest connector, so this usually stays the same.
        Choose a node to see its details, fetched from it over the cluster
        network.
      </p>

      <nav aria-label="Nodes">
        {peers.map((peer) => (
          <Link
            aria-current={
              peer.info.node === selected.info.node ? "page" : undefined
            }
            href={`/?node=${encodeURIComponent(peer.info.node)}`}
            key={peer.info.node}
            prefetch={false}
          >
            <span>{peer.info.node}</span>
            <small>{peer.info.location ?? "Unknown location"}</small>
          </Link>
        ))}
      </nav>

      {notFound ? (
        <p className="warning">
          That node isn't available, so this shows the serving node.
        </p>
      ) : null}
      {unreachable > 0 ? (
        <p className="warning">
          {unreachable === 1
            ? "1 pod did not respond"
            : `${unreachable} pods did not respond`}
          , so it may be missing from the list.
        </p>
      ) : null}

      <p className="status">
        Showing <strong>{selected.info.node}</strong>
        {selected.info.node === serving.info.node
          ? ", the node serving this page."
          : `, fetched by ${serving.info.node} in ${selected.latencyMs} ms.`}
      </p>

      <Details peer={selected} />

      <section className="wide">
        <h2>Your request</h2>
        <dl>
          <Row
            label="Cloudflare edge"
            value={edge ?? "Not through Cloudflare"}
          />
          <Row label="Your country" value={country ?? "Unknown"} />
          <Row label="Cloudflare ray" value={ray ?? "None"} />
        </dl>
      </section>
    </main>
  );
}
