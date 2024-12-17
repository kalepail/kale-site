import { xdr, Address } from "@stellar/stellar-sdk"

const SACId = "CB23WRDQWGSP6YPMY4UV5C4OW5CBTXKYN3XEATG7KJEZCXMJBYEHOUOV"
const contractId = "CDL74RF5BLYR2YBLCCI7F5FB6TPSCLKEJUBSD2RSVWZ4YHF3VMFAIGWA"

console.log(
    Address.fromString(SACId).toBuffer()
);

let key = xdr.LedgerKey.contractData(new xdr.LedgerKeyContractData({
    contract: Address.fromString(SACId).toScAddress(),
    key: xdr.ScVal.scvVec([
        xdr.ScVal.scvSymbol('Balance'),
        Address.fromString(contractId).toScVal()
    ]),
    durability: xdr.ContractDataDurability.persistent()
}))

console.log(key.toXDR('base64'));