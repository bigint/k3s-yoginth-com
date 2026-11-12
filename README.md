# k3s.yoginth.com

Test app for the homelab k3s cluster, built with Next.js. It shows which node served the request, and lets you pick any node to see its details.

Cloudflare always sends a visitor to the nearest connector, and the page shows that node: its name, location and the app's own details. Until 12 November 2026 it also listed every node and fetched a chosen node's details through a headless Service; that went when the cluster's DNS (CoreDNS) was removed, since the peers were found by DNS. The page and `/api/info` are public, so node, tailnet and pod addresses, pod and namespace names, the exact runtime version and host metrics are deliberately left out.

A push to `main` builds the image and updates `sites/k3s-yoginth-com.yaml` in `bigint/k3s`.
