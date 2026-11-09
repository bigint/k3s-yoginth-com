# k3s.yoginth.com

Test app for the homelab k3s cluster, built with Next.js. It shows which node served the request, and lets you pick any node to see its details.

Cloudflare always sends a visitor to the nearest connector, so the app fetches a chosen node's details from that node's pod. It finds the pods through a headless Service set up by the site chart (`nodeInfo: true`). The page and `/api/info` are public, so node, tailnet and pod addresses, pod and namespace names, and the exact runtime version are deliberately left out.

A push to `main` builds the image and updates `sites/k3s-yoginth-com.yaml` in `bigint/k3s`.
