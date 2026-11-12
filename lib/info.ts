import { readFileSync } from "node:fs";

export type NodeInfo = {
  location: string | null;
  memory: {
    processLimit: number | null;
    processUsed: number;
  };
  node: string;
  revision: string | null;
  uptime: {
    process: number;
  };
};

// /api/info and the page are public, so everything here is public. Node names
// already are, through x-served-by. Addresses, pod and namespace names, the
// exact runtime version and host metrics are deliberately left out.
const LOCATIONS: Record<string, string> = {
  "k3s-afn-01": "AGFN server room, Bengaluru",
  "k3s-home-01": "Bengaluru, India",
  "k3s-ovh-01": "OVH, Virginia, United States",
  "k3s-ovh-02": "OVH, London, United Kingdom",
  "k3s-ovh-03": "OVH, Singapore"
};

function memoryLimit(): number | null {
  try {
    const value = readFileSync("/sys/fs/cgroup/memory.max", "utf8").trim();
    const limit = Number(value);
    return Number.isFinite(limit) ? limit : null;
  } catch {
    return null;
  }
}

export function getNodeInfo(): NodeInfo {
  const node = process.env.NODE_NAME ?? "local";

  return {
    location: LOCATIONS[node] ?? null,
    memory: {
      processLimit: memoryLimit(),
      processUsed: process.memoryUsage().rss
    },
    node,
    revision: process.env.DEPLOYMENT_REVISION ?? null,
    uptime: {
      process: process.uptime()
    }
  };
}
