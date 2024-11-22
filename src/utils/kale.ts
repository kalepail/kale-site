import { Address, scValToNative, xdr } from "@stellar/stellar-sdk";
import { Durability, Server } from "@stellar/stellar-sdk/rpc";
import { Client } from "kale-sc-sdk";

export interface Block {
    timestamp?: bigint,
    min_gap: bigint,
    min_stake: bigint,
    min_zeros: bigint,
    max_gap: bigint,
    max_stake: bigint,
    max_zeros: bigint,
    entropy?: Buffer,
    staked_total?: bigint,
    normalized_total?: bigint,
}

export interface Pail {
    sequence: bigint,
    gap: bigint | undefined,
    stake: bigint,
    zeros: bigint | undefined,
}

export const rpc = new Server(import.meta.env.PUBLIC_RPC_URL);

export const contract = new Client({
    rpcUrl: import.meta.env.PUBLIC_RPC_URL,
    contractId: import.meta.env.PUBLIC_KALE_CONTRACT_ID,
    networkPassphrase: import.meta.env.PUBLIC_NETWORK_PASSPHRASE,
})

export async function getIndex() {
    let index: number = 0;

    await rpc.getContractData(
        import.meta.env.PUBLIC_KALE_CONTRACT_ID,
        xdr.ScVal.scvLedgerKeyContractInstance()
    ).then(({ val }) =>
        val.contractData()
            .val()
            .instance()
            .storage()
    ).then((storage) => {
        return storage?.map((entry) => {
            const key: string = scValToNative(entry.key())[0]

            if (key === 'FarmIndex') {
                index = entry.val().u32()
            }
        })
    })

    return index;
}

export async function getBlock(index: number) {
    let block: Block | undefined;

    await rpc.getContractData(import.meta.env.PUBLIC_KALE_CONTRACT_ID, xdr.ScVal.scvVec([
        xdr.ScVal.scvSymbol('Block'),
        xdr.ScVal.scvU32(Number(index))
    ]), Durability.Temporary)
        .then(({ val }) => {
            block = scValToNative(val.contractData().val())
        })

    return block
}

export async function getPail(index: number, address: string) {
    let pail: Pail | undefined;

    await rpc.getContractData(import.meta.env.PUBLIC_KALE_CONTRACT_ID, xdr.ScVal.scvVec([
        xdr.ScVal.scvSymbol('Pail'),
        Address.fromString(address).toScVal(),
        xdr.ScVal.scvU32(Number(index))
    ]), Durability.Temporary)
        .then(({ val }) => {
            pail = scValToNative(val.contractData().val())
        })

    return pail
}

export async function getContractData(address: string) {
    let index: number = 0;
    let block: Block | undefined;
    let pail: Pail | undefined;

    try {
        index = await getIndex();
        block = await getBlock(index);
        pail = await getPail(index, address);
    } catch { }

    return { index, block, pail }
}