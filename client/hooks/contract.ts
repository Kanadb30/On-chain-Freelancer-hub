"use client";

import {
  Contract,
  Networks,
  TransactionBuilder,
  Keypair,
  xdr,
  Address,
  nativeToScVal,
  scValToNative,
  rpc,
  Account,
} from "@stellar/stellar-sdk";
import {
  isConnected,
  getAddress,
  signTransaction,
  setAllowed,
  isAllowed,
  requestAccess,
} from "@stellar/freighter-api";

// ============================================================
// CONSTANTS — Update these for your contract
// ============================================================

/** Your deployed Soroban contract ID */
export const CONTRACT_ADDRESS =
  "CCV2N6JKKNQUKZIKNJPBHD7GICZESEXHQ73Q2CHBN5W5DSXXI36NG6NN";

/** Network passphrase (testnet by default) */
export const NETWORK_PASSPHRASE = Networks.TESTNET;

/** Soroban RPC URL */
export const RPC_URL = "https://soroban-testnet.stellar.org";

/** Horizon URL */
export const HORIZON_URL = "https://horizon-testnet.stellar.org";

/** Network name for Freighter */
export const NETWORK = "TESTNET";

// ============================================================
// RPC Server Instance
// ============================================================

const server = new rpc.Server(RPC_URL);

// ============================================================
// Wallet Helpers
// ============================================================

export async function checkConnection(): Promise<boolean> {
  const result = await isConnected();
  return result.isConnected;
}

export async function connectWallet(): Promise<string> {
  const connResult = await isConnected();
  if (!connResult.isConnected) {
    throw new Error("Freighter extension is not installed or not available.");
  }

  const allowedResult = await isAllowed();
  if (!allowedResult.isAllowed) {
    await setAllowed();
    await requestAccess();
  }

  const { address } = await getAddress();
  if (!address) {
    throw new Error("Could not retrieve wallet address from Freighter.");
  }
  return address;
}

export async function getWalletAddress(): Promise<string | null> {
  try {
    const connResult = await isConnected();
    if (!connResult.isConnected) return null;

    const allowedResult = await isAllowed();
    if (!allowedResult.isAllowed) return null;

    const { address } = await getAddress();
    return address || null;
  } catch {
    return null;
  }
}

// ============================================================
// Contract Interaction Helpers
// ============================================================

/**
 * Build, simulate, and optionally sign + submit a Soroban contract call.
 *
 * @param method   - The contract method name to invoke
 * @param params   - Array of xdr.ScVal parameters for the method
 * @param caller   - The public key (G...) of the calling account
 * @param sign     - If true, signs via Freighter and submits. If false, only simulates.
 * @returns        The result of the simulation or submission
 */
export async function callContract(
  method: string,
  params: xdr.ScVal[] = [],
  caller: string,
  sign: boolean = true
) {
  const contract = new Contract(CONTRACT_ADDRESS);
  let account;
  try {
    account = await server.getAccount(caller);
  } catch (e) {
    if (!sign) {
      account = new Account(caller, "0");
    } else {
      throw e;
    }
  }

  const tx = new TransactionBuilder(account, {
    fee: "100",
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...params))
    .setTimeout(30)
    .build();

  const simulated = await server.simulateTransaction(tx);

  if (rpc.Api.isSimulationError(simulated)) {
    throw new Error(
      `Simulation failed: ${(simulated as rpc.Api.SimulateTransactionErrorResponse).error}`
    );
  }

  if (!sign) {
    // Read-only call — just return the simulation result
    return simulated;
  }

  // Prepare the transaction with the simulation result
  const prepared = rpc.assembleTransaction(tx, simulated).build();

  // Sign with Freighter
  const { signedTxXdr } = await signTransaction(prepared.toXDR(), {
    networkPassphrase: NETWORK_PASSPHRASE,
  });

  const txToSubmit = TransactionBuilder.fromXDR(
    signedTxXdr,
    NETWORK_PASSPHRASE
  );

  const result = await server.sendTransaction(txToSubmit);

  if (result.status === "ERROR") {
    throw new Error(`Transaction submission failed: ${result.status}`);
  }

  // Poll for confirmation
  let getResult = await server.getTransaction(result.hash);
  while (getResult.status === "NOT_FOUND") {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    getResult = await server.getTransaction(result.hash);
  }

  if (getResult.status === "FAILED") {
    throw new Error("Transaction failed on chain.");
  }

  return getResult;
}

/**
 * Read-only contract call (does not require signing).
 */
export async function readContract(
  method: string,
  params: xdr.ScVal[] = [],
  caller?: string
) {
  const account =
    caller || Keypair.random().publicKey(); // Use a random keypair for read-only
  const sim = await callContract(method, params, account, false);
  if (
    rpc.Api.isSimulationSuccess(sim as rpc.Api.SimulateTransactionResponse) &&
    (sim as rpc.Api.SimulateTransactionSuccessResponse).result
  ) {
    return scValToNative(
      (sim as rpc.Api.SimulateTransactionSuccessResponse).result!.retval
    );
  }
  return null;
}

// ============================================================
// ScVal Conversion Helpers
// ============================================================

export function toScValString(value: string): xdr.ScVal {
  return nativeToScVal(value, { type: "string" });
}

export function toScValU32(value: number): xdr.ScVal {
  return nativeToScVal(value, { type: "u32" });
}

export function toScValI128(value: bigint): xdr.ScVal {
  return nativeToScVal(value, { type: "i128" });
}

export function toScValAddress(address: string): xdr.ScVal {
  return new Address(address).toScVal();
}

export function toScValBool(value: boolean): xdr.ScVal {
  return nativeToScVal(value, { type: "bool" });
}

// ============================================================
// Freelancer Hub — Contract Methods
// ============================================================

export function toScValU64(value: number | bigint): xdr.ScVal {
  return nativeToScVal(value, { type: "u64" });
}

/**
 * Post a new job.
 * Calls: post_job(title: String, descrip: String, budget: u64)
 */
export async function postJob(
  caller: string,
  title: string,
  descrip: string,
  budget: number
) {
  return callContract(
    "post_job",
    [toScValString(title), toScValString(descrip), toScValU64(budget)],
    caller,
    true
  );
}

/**
 * Submit a bid for a job.
 * Calls: submit_bid(job_id: u64, proposal: String, ask_price: u64)
 */
export async function submitBid(
  caller: string,
  jobId: number,
  proposal: string,
  askPrice: number
) {
  return callContract(
    "submit_bid",
    [toScValU64(jobId), toScValString(proposal), toScValU64(askPrice)],
    caller,
    true
  );
}

/**
 * Accept a bid.
 * Calls: accept_bid(job_id: u64, bid_id: u64)
 */
export async function acceptBid(
  caller: string,
  jobId: number,
  bidId: number
) {
  return callContract(
    "accept_bid",
    [toScValU64(jobId), toScValU64(bidId)],
    caller,
    true
  );
}

/**
 * Complete a job.
 * Calls: complete_job(job_id: u64)
 */
export async function completeJob(
  caller: string,
  jobId: number
) {
  return callContract(
    "complete_job",
    [toScValU64(jobId)],
    caller,
    true
  );
}

/**
 * Get Hub Stats (read-only).
 * Calls: view_hub_stats()
 */
export async function viewHubStats() {
  return readContract("view_hub_stats", []);
}

/**
 * Get Job (read-only).
 * Calls: view_job(job_id: u64)
 */
export async function viewJob(jobId: number) {
  return readContract("view_job", [toScValU64(jobId)]);
}

/**
 * Get Bid (read-only).
 * Calls: view_bid(bid_id: u64)
 */
export async function viewBid(bidId: number) {
  return readContract("view_bid", [toScValU64(bidId)]);
}

export { nativeToScVal, scValToNative, Address, xdr };
