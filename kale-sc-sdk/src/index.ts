import { Buffer } from "buffer";
import { Address } from '@stellar/stellar-sdk';
import {
  AssembledTransaction,
  Client as ContractClient,
  ClientOptions as ContractClientOptions,
  Result,
  Spec as ContractSpec,
} from '@stellar/stellar-sdk/contract';
import type {
  u32,
  i32,
  u64,
  i64,
  u128,
  i128,
  u256,
  i256,
  Option,
  Typepoint,
  Duration,
} from '@stellar/stellar-sdk/contract';
export * from '@stellar/stellar-sdk'
export * as contract from '@stellar/stellar-sdk/contract'
export * as rpc from '@stellar/stellar-sdk/rpc'

if (typeof window !== 'undefined') {
  //@ts-ignore Buffer exists
  window.Buffer = window.Buffer || Buffer;
}


export const networks = {
  unknown: {
    networkPassphrase: "Public Global Stellar Network ; September 2015",
    contractId: "CDL74RF5BLYR2YBLCCI7F5FB6TPSCLKEJUBSD2RSVWZ4YHF3VMFAIGWA",
  }
} as const

export const Errors = {
  1: {message:"HomesteadExists"},

  2: {message:"HomesteadMissing"},

  3: {message:"AssetAdminInvalid"},

  4: {message:"FarmPaused"},

  5: {message:"FarmNotPaused"},

  6: {message:"PlantAmountTooLow"},

  7: {message:"ZeroCountTooLow"},

  8: {message:"PailExists"},

  9: {message:"PailMissing"},

  10: {message:"WorkMissing"},

  11: {message:"BlockMissing"},

  12: {message:"BlockInvalid"},

  13: {message:"HashInvalid"},

  14: {message:"HarvestNotReady"}
}

export interface Block {
  entropy: Buffer;
  max_gap: u32;
  max_stake: i128;
  max_zeros: u32;
  min_gap: u32;
  min_stake: i128;
  min_zeros: u32;
  normalized_total: i128;
  staked_total: i128;
  timestamp: u64;
}


export interface Pail {
  gap: Option<u32>;
  sequence: u32;
  stake: i128;
  zeros: Option<u32>;
}

export type Storage = {tag: "Homesteader", values: void} | {tag: "HomesteadAsset", values: void} | {tag: "FarmIndex", values: void} | {tag: "FarmBlock", values: void} | {tag: "FarmPaused", values: void} | {tag: "Block", values: readonly [u32]} | {tag: "Pail", values: readonly [string, u32]};


export interface Client {
  /**
   * Construct and simulate a plant transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  plant: ({farmer, amount}: {farmer: string, amount: i128}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a work transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  work: ({farmer, hash, nonce}: {farmer: string, hash: Buffer, nonce: u64}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<u32>>

  /**
   * Construct and simulate a harvest transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  harvest: ({farmer, index}: {farmer: string, index: u32}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a homestead transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  homestead: ({farmer, asset}: {farmer: string, asset: string}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a upgrade transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  upgrade: ({hash}: {hash: Buffer}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a pause transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  pause: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a unpause transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  unpause: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a remove_block transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  remove_block: ({index}: {index: u32}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<null>>

}
export class Client extends ContractClient {
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAAAAAAAAAAAAAFcGxhbnQAAAAAAAACAAAAAAAAAAZmYXJtZXIAAAAAABMAAAAAAAAABmFtb3VudAAAAAAACwAAAAA=",
        "AAAAAAAAAAAAAAAEd29yawAAAAMAAAAAAAAABmZhcm1lcgAAAAAAEwAAAAAAAAAEaGFzaAAAA+4AAAAgAAAAAAAAAAVub25jZQAAAAAAAAYAAAABAAAABA==",
        "AAAAAAAAAAAAAAAHaGFydmVzdAAAAAACAAAAAAAAAAZmYXJtZXIAAAAAABMAAAAAAAAABWluZGV4AAAAAAAABAAAAAEAAAAL",
        "AAAAAAAAAAAAAAAJaG9tZXN0ZWFkAAAAAAAAAgAAAAAAAAAGZmFybWVyAAAAAAATAAAAAAAAAAVhc3NldAAAAAAAABMAAAAA",
        "AAAAAAAAAAAAAAAHdXBncmFkZQAAAAABAAAAAAAAAARoYXNoAAAD7gAAACAAAAAA",
        "AAAAAAAAAAAAAAAFcGF1c2UAAAAAAAAAAAAAAA==",
        "AAAAAAAAAAAAAAAHdW5wYXVzZQAAAAAAAAAAAA==",
        "AAAAAAAAAAAAAAAMcmVtb3ZlX2Jsb2NrAAAAAQAAAAAAAAAFaW5kZXgAAAAAAAAEAAAAAA==",
        "AAAABAAAAAAAAAAAAAAABkVycm9ycwAAAAAADgAAAAAAAAAPSG9tZXN0ZWFkRXhpc3RzAAAAAAEAAAAAAAAAEEhvbWVzdGVhZE1pc3NpbmcAAAACAAAAAAAAABFBc3NldEFkbWluSW52YWxpZAAAAAAAAAMAAAAAAAAACkZhcm1QYXVzZWQAAAAAAAQAAAAAAAAADUZhcm1Ob3RQYXVzZWQAAAAAAAAFAAAAAAAAABFQbGFudEFtb3VudFRvb0xvdwAAAAAAAAYAAAAAAAAAD1plcm9Db3VudFRvb0xvdwAAAAAHAAAAAAAAAApQYWlsRXhpc3RzAAAAAAAIAAAAAAAAAAtQYWlsTWlzc2luZwAAAAAJAAAAAAAAAAtXb3JrTWlzc2luZwAAAAAKAAAAAAAAAAxCbG9ja01pc3NpbmcAAAALAAAAAAAAAAxCbG9ja0ludmFsaWQAAAAMAAAAAAAAAAtIYXNoSW52YWxpZAAAAAANAAAAAAAAAA9IYXJ2ZXN0Tm90UmVhZHkAAAAADg==",
        "AAAAAQAAAAAAAAAAAAAABUJsb2NrAAAAAAAACgAAAAAAAAAHZW50cm9weQAAAAPuAAAAIAAAAAAAAAAHbWF4X2dhcAAAAAAEAAAAAAAAAAltYXhfc3Rha2UAAAAAAAALAAAAAAAAAAltYXhfemVyb3MAAAAAAAAEAAAAAAAAAAdtaW5fZ2FwAAAAAAQAAAAAAAAACW1pbl9zdGFrZQAAAAAAAAsAAAAAAAAACW1pbl96ZXJvcwAAAAAAAAQAAAAAAAAAEG5vcm1hbGl6ZWRfdG90YWwAAAALAAAAAAAAAAxzdGFrZWRfdG90YWwAAAALAAAAAAAAAAl0aW1lc3RhbXAAAAAAAAAG",
        "AAAAAQAAAAAAAAAAAAAABFBhaWwAAAAEAAAAAAAAAANnYXAAAAAD6AAAAAQAAAAAAAAACHNlcXVlbmNlAAAABAAAAAAAAAAFc3Rha2UAAAAAAAALAAAAAAAAAAV6ZXJvcwAAAAAAA+gAAAAE",
        "AAAAAgAAAAAAAAAAAAAAB1N0b3JhZ2UAAAAABwAAAAAAAAAAAAAAC0hvbWVzdGVhZGVyAAAAAAAAAAAAAAAADkhvbWVzdGVhZEFzc2V0AAAAAAAAAAAAAAAAAAlGYXJtSW5kZXgAAAAAAAAAAAAAAAAAAAlGYXJtQmxvY2sAAAAAAAAAAAAAAAAAAApGYXJtUGF1c2VkAAAAAAABAAAAAAAAAAVCbG9jawAAAAAAAAEAAAAEAAAAAQAAAAAAAAAEUGFpbAAAAAIAAAATAAAABA==" ]),
      options
    )
  }
  public readonly fromJSON = {
    plant: this.txFromJSON<null>,
        work: this.txFromJSON<u32>,
        harvest: this.txFromJSON<i128>,
        homestead: this.txFromJSON<null>,
        upgrade: this.txFromJSON<null>,
        pause: this.txFromJSON<null>,
        unpause: this.txFromJSON<null>,
        remove_block: this.txFromJSON<null>
  }
}