import { readFileSync } from "node:fs";
import os from "node:os";

export type NodeInfo = {
  arch: string;
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
  namespace: string | null;
  node: string;
  nodeVersion: string;
  platform: string;
  pod: string | null;
  podIp: string | null;
  revision: string | null;
  time: string;
  uptime: {
    process: number;
    system: number;
  };
};

// Node names are public through x-served-by. Addresses are deliberately left
// out: this page must not publish a node's public or tailnet IP.
const LOCATIONS: Record<string, string> = {
  "k3s-home-01": "Home, India",
  "k3s-hxc-mum-01": "Mumbai, India",
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
    arch: process.arch,
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
    namespace: process.env.POD_NAMESPACE ?? null,
    node,
    nodeVersion: process.version,
    platform: process.platform,
    pod: process.env.POD_NAME ?? null,
    podIp: process.env.POD_IP ?? null,
    revision: process.env.DEPLOYMENT_REVISION ?? null,
    time: new Date().toISOString(),
    uptime: {
      process: process.uptime(),
      system: os.uptime()
    }
  };
}
