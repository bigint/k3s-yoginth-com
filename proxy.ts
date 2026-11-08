import { NextResponse } from "next/server";

// Reports which k3s node served the response. NODE_NAME comes from the site
// chart in bigint/k3s; it is absent locally, so no header is added.
export function proxy() {
  const response = NextResponse.next();
  const node = process.env.NODE_NAME;
  if (node) {
    response.headers.set("x-served-by", node);
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
