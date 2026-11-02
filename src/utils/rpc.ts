import { Address, xdr } from "@stellar/stellar-sdk";
import { Api, Durability, Server } from "@stellar/stellar-sdk/rpc";

// Read-only chain data with endpoint failover. PUBLIC_RPC_URL leads; on mainnet the free public
// RPCs follow. Each call tries the last endpoint that worked first, then the rest in order.
// Transactions (simulate/send via the contract clients and passkey-kit) still use PUBLIC_RPC_URL.
const MAINNET_PASSPHRASE = "Public Global Stellar Network ; September 2015";
const MAINNET_FALLBACKS = [
    "https://mainnet.sorobanrpc.com",
    "https://rpc.lightsail.network",
    "https://soroban-rpc.mainnet.stellar.gateway.fm",
    "https://rpc.ankr.com/stellar_soroban",
];
const TIMEOUT_MS = 10_000;

export const rpcUrls = [
    ...new Set([
        import.meta.env.PUBLIC_RPC_URL,
        ...(import.meta.env.PUBLIC_NETWORK_PASSPHRASE === MAINNET_PASSPHRASE ? MAINNET_FALLBACKS : []),
    ]),
];

const servers = rpcUrls.map((url) => new Server(url, { timeout: TIMEOUT_MS }));
let preferred = 0;

async function read<T>(fn: (server: Server) => Promise<T>): Promise<T> {
    let lastError: unknown;

    for (let i = 0; i < servers.length; i++) {
        const index = (preferred + i) % servers.length;
        try {
            const value = await fn(servers[index]);
            preferred = index;
            return value;
        } catch (err) {
            lastError = err;
        }
    }

    throw lastError;
}

export const rpc = {
    getLatestLedger: () => read((server) => server.getLatestLedger()),

    _getEvents: (request: Api.GetEventsRequest) => read((server) => server._getEvents(request)),

    // Same result shape as Server.getContractData. The SDK version reports every failure as a
    // 404, so read the entry directly: a network error fails over, a missing entry does not.
    async getContractData(
        contract: string | Address,
        key: xdr.ScVal,
        durability: Durability = Durability.Persistent,
    ): Promise<Api.LedgerEntryResult> {
        const address = typeof contract === "string" ? Address.fromString(contract) : contract;
        const ledgerKey = xdr.LedgerKey.contractData(
            new xdr.LedgerKeyContractData({
                contract: address.toScAddress(),
                key,
                durability: durability === Durability.Temporary
                    ? xdr.ContractDataDurability.temporary()
                    : xdr.ContractDataDurability.persistent(),
            }),
        );

        const { entries } = await read((server) => server.getLedgerEntries(ledgerKey));
        if (!entries.length) {
            throw { code: 404, message: `Contract data not found for ${address.toString()}` };
        }
        return entries[0];
    },
};
