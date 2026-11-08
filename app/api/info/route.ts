import { NextResponse } from "next/server";
import { getNodeInfo } from "@/lib/info";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(getNodeInfo(), {
    headers: { "cache-control": "no-store" }
  });
}
