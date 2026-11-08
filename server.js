const http = require("node:http");

const node = process.env.NODE_NAME || "unknown";
const safeNode = node.replace(/[^\w.-]/g, "");
const port = Number(process.env.PORT) || 3000;

const page = `<!doctype html>
<html lang="en">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>k3s: ${safeNode}</title>
<style>
  :root { color-scheme: light dark; }
  body { margin: 0; min-height: 100vh; display: grid; place-content: center; text-align: center; font-family: system-ui, sans-serif; }
  p { margin: 0; opacity: .7; }
  h1 { margin: .25rem 0; font-size: clamp(2.5rem, 10vw, 6rem); overflow-wrap: anywhere; }
</style>
<p>Served by node</p>
<h1>${safeNode}</h1>
<p>Reload to check again.</p>
</html>
`;

const server = http.createServer((req, res) => {
  res.setHeader("x-served-by", node);
  res.setHeader("cache-control", "no-store");
  if (req.url !== "/" || !["GET", "HEAD"].includes(req.method)) {
    res.writeHead(404, { "content-type": "text/plain" });
    res.end("Not found\n");
    return;
  }
  res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
  res.end(req.method === "HEAD" ? undefined : page);
});

server.listen(port, process.env.HOSTNAME || "0.0.0.0");

for (const signal of ["SIGTERM", "SIGINT"]) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
