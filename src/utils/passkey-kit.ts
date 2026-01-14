import { PasskeyKit, PasskeyServer, SACClient } from "passkey-kit";
import { AssembledTransaction } from "@stellar/stellar-sdk/minimal/contract";
import type { Tx } from "@stellar/stellar-sdk/minimal/contract";
import { get } from "svelte/store";
import { turnstileToken } from "../store/turnstileToken";

export const account = new PasskeyKit({
    rpcUrl: import.meta.env.PUBLIC_RPC_URL,
    networkPassphrase: import.meta.env.PUBLIC_NETWORK_PASSPHRASE,
    walletWasmHash: import.meta.env.PUBLIC_WALLET_WASM_HASH,
    timeoutInSeconds: 30,
});

const server = new PasskeyServer({
    rpcUrl: import.meta.env.PUBLIC_RPC_URL,
    relayerUrl: import.meta.env.PUBLIC_RELAYER_URL,
    relayerApiKey: import.meta.env.PUBLIC_RELAYER_API_KEY,
});

export const sac = new SACClient({
    rpcUrl: import.meta.env.PUBLIC_RPC_URL,
    networkPassphrase: import.meta.env.PUBLIC_NETWORK_PASSPHRASE,
});

export const kale = sac.getSACClient(import.meta.env.PUBLIC_KALE_SAC_ID);

/**
 * Send a transaction through the relayer.
 * - In development (with API key): calls server.send() directly
 * - In production (no API key): sends to relayer URL with Turnstile header
 */
export async function send<T>(txn: AssembledTransaction<T> | Tx | string) {
    // Extract XDR from transaction
    let xdr: string;
    if (txn instanceof AssembledTransaction) {
        xdr = txn.built!.toXDR();
    } else if (typeof txn !== 'string') {
        xdr = txn.toXDR();
    } else {
        xdr = txn;
    }

    // If we have an API key, use server.send directly
    if (import.meta.env.PUBLIC_RELAYER_API_KEY) {
        return server.send(xdr);
    }

    // Otherwise, send to relayer URL with Turnstile token
    const token = get(turnstileToken);
    if (!token) {
        throw new Error('Turnstile token not available');
    }

    const response = await fetch(import.meta.env.PUBLIC_RELAYER_URL, {
        method: 'POST',
        headers: {
            'X-Turnstile-Response': token,
        },
        body: new URLSearchParams({ xdr }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Relayer error: ${error}`);
    }

    return response.json();
}
