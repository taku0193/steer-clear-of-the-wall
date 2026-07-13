import { NextResponse } from "next/server";
import { RankingDatabaseUnavailableError } from "../../../src/ranking/rankingErrors";
import { listRankings, submitRanking } from "../../../src/ranking/rankingService";
import type { RankingApiError } from "../../../src/ranking/rankingTypes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 8 * 1024;
const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

export async function GET() {
  try {
    return NextResponse.json(listRankings(), { headers: NO_STORE_HEADERS });
  } catch (error) {
    logServerError("ranking GET failed", error);
    return errorResponse(
      "databaseUnavailable",
      "ランキングを取得できませんでした",
      503,
    );
  }
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_BODY_BYTES) {
    return errorResponse("payloadTooLarge", "送信内容が大きすぎます", 413);
  }

  let input: unknown;
  try {
    const body = await request.text();
    if (new TextEncoder().encode(body).byteLength > MAX_BODY_BYTES) {
      return errorResponse("payloadTooLarge", "送信内容が大きすぎます", 413);
    }
    input = JSON.parse(body);
  } catch {
    return errorResponse("invalidSubmission", "送信内容が正しくありません", 400);
  }

  try {
    const result = submitRanking(input);
    if (result.ok) {
      return NextResponse.json(result.value, {
        status: 201,
        headers: NO_STORE_HEADERS,
      });
    }
    if (result.type === "duplicateSubmission") {
      return errorResponse("duplicateSubmission", "この結果は登録済みです", 409);
    }
    return NextResponse.json<RankingApiError>(
      {
        error: {
          code: "invalidSubmission",
          message: "入力内容を確認してください",
          fields: result.fields,
        },
      },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  } catch (error) {
    logServerError("ranking POST failed", error);
    const status = error instanceof RankingDatabaseUnavailableError ? 503 : 500;
    return errorResponse(
      status === 503 ? "databaseUnavailable" : "rankingUnavailable",
      "ランキングへ登録できませんでした",
      status,
    );
  }
}

function errorResponse(
  code: RankingApiError["error"]["code"],
  message: string,
  status: number,
) {
  return NextResponse.json<RankingApiError>(
    { error: { code, message } },
    { status, headers: NO_STORE_HEADERS },
  );
}

function logServerError(context: string, error: unknown) {
  console.error(context, error instanceof Error ? error.message : "unknown error");
}
