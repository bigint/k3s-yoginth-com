import { resolve4 } from "node:dns/promises";
import { getNodeInfo, type NodeInfo } from "@/lib/info";

const PEER_TIMEOUT_MS = 2000;

export type Peer = {
  info: NodeInfo;
  // Time to fetch this node's details from the node serving the page.
  latencyMs: number;
};

export type Peers = {
  peers: Peer[];
  self: Peer;
  unreachable: number;
};

async function fetchPeer(ip: string, port: string): Promise<Peer | null> {
  const start = performance.now();
  try {
    const response = await fetch(`http://${ip}:${port}/api/info`, {
      cache: "no-store",
      signal: AbortSignal.timeout(PEER_TIMEOUT_MS)
    });
    if (!response.ok) {
      return null;
    }
    const info = (await response.json()) as NodeInfo;
    return { info, latencyMs: Math.round(performance.now() - start) };
  } catch {
    return null;
  }
}

// Every pod of this site has one address behind a headless Service. Addresses
// come only from cluster DNS, never from the request, so a visitor cannot
// point these fetches anywhere else.
export async function getPeers(): Promise<Peers> {
  const self: Peer = { info: getNodeInfo(), latencyMs: 0 };
  const host = process.env.PEERS_HOST;
  if (!host) {
    return { peers: [self], self, unreachable: 0 };
  }

  let addresses: string[];
  try {
    addresses = await resolve4(host);
  } catch {
    return { peers: [self], self, unreachable: 0 };
  }

  const others = addresses.filter((ip) => ip !== process.env.POD_IP);
  const port = process.env.PORT ?? "3000";
  const results = await Promise.all(others.map((ip) => fetchPeer(ip, port)));
  const reached = results.filter((peer): peer is Peer => peer !== null);

  // During a rollout a node can have two pods; keep one row per node.
  const byNode = new Map<string, Peer>([[self.info.node, self]]);
  for (const peer of reached) {
    if (!byNode.has(peer.info.node)) {
      byNode.set(peer.info.node, peer);
    }
  }

  return {
    peers: [...byNode.values()].sort((a, b) =>
      a.info.node.localeCompare(b.info.node)
    ),
    self,
    unreachable: results.length - reached.length
  };
}
