import { Buffer } from "buffer";
import { Client as ContractClient, Spec as ContractSpec, } from '@stellar/stellar-sdk/contract';
export * from '@stellar/stellar-sdk';
export * as contract from '@stellar/stellar-sdk/contract';
export * as rpc from '@stellar/stellar-sdk/rpc';
if (typeof window !== 'undefined') {
    //@ts-ignore Buffer exists
    window.Buffer = window.Buffer || Buffer;
}
export const networks = {
    unknown: {
        networkPassphrase: "Public Global Stellar Network ; September 2015",
        contractId: "CDL74RF5BLYR2YBLCCI7F5FB6TPSCLKEJUBSD2RSVWZ4YHF3VMFAIGWA",
    }
};
export const Errors = {
    1: { message: "HomesteadExists" },
    2: { message: "HomesteadMissing" },
    3: { message: "AssetAdminInvalid" },
    4: { message: "FarmPaused" },
    5: { message: "FarmNotPaused" },
    6: { message: "PlantAmountTooLow" },
    7: { message: "ZeroCountTooLow" },
    8: { message: "PailExists" },
    9: { message: "PailMissing" },
    10: { message: "WorkMissing" },
    11: { message: "BlockMissing" },
    12: { message: "BlockInvalid" },
    13: { message: "HashInvalid" },
    14: { message: "HarvestNotReady" }
};
export class Client extends ContractClient {
    options;
    constructor(options) {
        super(new ContractSpec(["AAAAAAAAAAAAAAAFcGxhbnQAAAAAAAACAAAAAAAAAAZmYXJtZXIAAAAAABMAAAAAAAAABmFtb3VudAAAAAAACwAAAAA=",
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
            "AAAAAgAAAAAAAAAAAAAAB1N0b3JhZ2UAAAAABwAAAAAAAAAAAAAAC0hvbWVzdGVhZGVyAAAAAAAAAAAAAAAADkhvbWVzdGVhZEFzc2V0AAAAAAAAAAAAAAAAAAlGYXJtSW5kZXgAAAAAAAAAAAAAAAAAAAlGYXJtQmxvY2sAAAAAAAAAAAAAAAAAAApGYXJtUGF1c2VkAAAAAAABAAAAAAAAAAVCbG9jawAAAAAAAAEAAAAEAAAAAQAAAAAAAAAEUGFpbAAAAAIAAAATAAAABA=="]), options);
        this.options = options;
    }
    fromJSON = {
        plant: (this.txFromJSON),
        work: (this.txFromJSON),
        harvest: (this.txFromJSON),
        homestead: (this.txFromJSON),
        upgrade: (this.txFromJSON),
        pause: (this.txFromJSON),
        unpause: (this.txFromJSON),
        remove_block: (this.txFromJSON)
    };
}
