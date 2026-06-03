import { NextRequest, NextResponse } from "next/server";

// ── Open-source build ────────────────────────────────────────────────────────
// The full Skopos chat engine — the 3-layer request waterfall (structural →
// account → intent), intent parsing, prompt construction, and LLM safety
// boundaries — is part of Skopos's private implementation and is not included
// in this open-source distribution.
//
// This stub keeps the route present so the project builds and runs. To wire your
// own engine, implement the POST handler below.
//
// The public on-chain oracle surface lives at /api/vara and relay/ — those are
// the Vara integration components and are fully open.

export async function POST(_req: NextRequest): Promise<NextResponse> {
  return NextResponse.json(
    {
      type: "error",
      text: "The chat engine is not available in the open-source build. See /api/vara and relay/ for the open Vara oracle integration.",
    },
    { status: 501 },
  );
}
