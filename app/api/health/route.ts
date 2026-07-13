import { NextResponse } from "next/server";
import { getRankingRepository } from "../../../src/ranking/rankingRepository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    if (!getRankingRepository().healthCheck()) throw new Error("health check failed");
    return NextResponse.json(
      { status: "ok" },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error(
      "ranking health check failed",
      error instanceof Error ? error.message : "unknown error",
    );
    return NextResponse.json(
      { status: "unavailable" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
