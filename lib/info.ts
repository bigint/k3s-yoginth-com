import { readFileSync } from "node:fs";
import os from "node:os";

export type NodeInfo = {
  cpuCount: number;
  cpuModel: string;
  loadAverage: number[];
  location: string | null;
  memory: {
    processLimit: number | null;
    processUsed: number;
    systemFree: number;
    systemTotal: number;
  };
  node: string;
  revision: string | null;
  uptime: {
    process: number;
    system: number;
  };
};

// /api/info and the page are public, so everything here is public. Node names
// already are, through x-served-by. Addresses, pod and namespace names and the
// exact runtime version are deliberately left out.
const LOCATIONS: Record<string, string> = {
  "k3s-agfn-01": "Asia Giga Fibernet",
  "k3s-home-01": "Bengaluru, India",
  "k3s-hxc-01": "Mumbai, India",
  "k3s-ws-01": "Worldstream, Netherlands"
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
  const cpus = os.cpus();

  return {
    cpuCount: cpus.length,
    cpuModel: cpus[0]?.model ?? "Unknown",
    loadAverage: os.loadavg(),
    location: LOCATIONS[node] ?? null,
    memory: {
      processLimit: memoryLimit(),
      processUsed: process.memoryUsage().rss,
      systemFree: os.freemem(),
      systemTotal: os.totalmem()
    },
    node,
    revision: process.env.DEPLOYMENT_REVISION ?? null,
    uptime: {
      process: process.uptime(),
      system: os.uptime()
    }
  };
}
