import { Buffer } from "buffer";
import { AssembledTransaction, Client as ContractClient, type ClientOptions as ContractClientOptions, type MethodOptions } from '@stellar/stellar-sdk/contract';
import type { u32, i128 } from '@stellar/stellar-sdk/contract';
export declare const Errors: {
    1: {
        message: string;
    };
    2: {
        message: string;
    };
};
export interface Client {
    /**
     * Construct and simulate a harvest transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     * Harvest multiple pails available for your KALE farmer.
     *
     * # Arguments
     * - `farmer` - address of the farmer to harvest on behalf of
     * - `pails` - vector of pails which should be harvested
     *
     * # Panics
     * - If the `pails` vector is empty
     * - If no pails result in a non-zero reward
     */
    harvest: ({ farmer, pails }: {
        farmer: string;
        pails: Array<u32>;
    }, options?: {
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
    }) => Promise<AssembledTransaction<Array<i128>>>;
}
export declare class Client extends ContractClient {
    readonly options: ContractClientOptions;
    static deploy<T = Client>(
    /** Constructor/Initialization Args for the contract's `__constructor` method */
    { farm }: {
        farm: string;
    }, 
    /** Options for initalizing a Client as well as for calling a method, with extras specific to deploying. */
    options: MethodOptions & Omit<ContractClientOptions, "contractId"> & {
        /** The hash of the Wasm blob, which must already be installed on-chain. */
        wasmHash: Buffer | string;
        /** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
        salt?: Buffer | Uint8Array;
        /** The format used to decode `wasmHash`, if it's provided as a string. */
        format?: "hex" | "base64";
    }): Promise<AssembledTransaction<T>>;
    constructor(options: ContractClientOptions);
    readonly fromJSON: {
        harvest: (json: string) => AssembledTransaction<bigint[]>;
    };
}
