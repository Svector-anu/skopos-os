import { execFile } from "node:child_process";
import { writeFileSync, unlinkSync } from "node:fs";
import { promisify } from "node:util";
import { join } from "node:path";
import { tmpdir } from "node:os";
import type { GearApi } from "@gear-js/api";
import { config } from "./config.js";
import type { BridgeResult } from "./types.js";

const execFileAsync = promisify(execFile);

export async function fulfillRequest(
  _api: GearApi,
  bridgeProgramId: string,
  requestId: bigint,
  result: BridgeResult,
): Promise<void> {
  const resultJson = JSON.stringify(result);
  const args = [requestId.toString(), resultJson];

  const tmpFile = join(tmpdir(), `fulfill-${requestId}-${Date.now()}.json`);
  try {
    writeFileSync(tmpFile, JSON.stringify(args));
    const { stdout } = await execFileAsync("vara-wallet", [
      "--account", config.varaAccount,
      "--network", config.varaNetwork,
      "--json",
      "call", bridgeProgramId,
      "SkoposOracle/FulfillRequest",
      "--args-file", tmpFile,
      "--idl", config.oracleIdl,
    ], { timeout: 60_000 });
    const parsed = JSON.parse(stdout) as { txHash?: string };
    console.log(`[chain-writer] fulfill_request ${requestId} tx=${parsed.txHash ?? "unknown"}`);
  } finally {
    try { unlinkSync(tmpFile); } catch { /* ignore */ }
  }
}

/**
 * Check whether a request is still pending on-chain before re-submitting after crash recovery.
 * QueryPending : () -> vec u64 — returns all pending request IDs.
 * Returns true  = still pending (safe to submit fulfill_request).
 * Returns false = already fulfilled (skip to avoid double-spend of gas).
 * Fails open: if the call errors, returns true so the relay retries.
 */
export async function queryPending(
  _api: GearApi,
  bridgeProgramId: string,
  requestId: bigint,
): Promise<boolean> {
  try {
    const { stdout } = await execFileAsync("vara-wallet", [
      "--network", config.varaNetwork,
      "--json",
      "call", bridgeProgramId,
      "SkoposOracle/QueryPending",
      "--args", "[]",
      "--idl", config.oracleIdl,
    ], { timeout: 30_000 });
    const parsed = JSON.parse(stdout) as { result?: string[] };
    const pendingIds = parsed.result ?? [];
    return pendingIds.some(id => BigInt(id) === requestId);
  } catch (err) {
    console.warn(`[chain-writer] queryPending(${requestId}) failed, assuming pending:`, err);
    return true;
  }
}
