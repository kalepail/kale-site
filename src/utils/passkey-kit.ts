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

export const server = new PasskeyServer({
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
 * - In development: calls server.send() directly (API key auth)
 * - In production: sends to proxy with Turnstile header (Turnstile auth)
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

    // In development, use server.send directly (API key auth)
    if (import.meta.env.DEV) {
        return server.send(xdr);
    }

    // In production, send to proxy with Turnstile token
    const token = get(turnstileToken);
    if (!token) {
        throw new Error('Turnstile token not available');
    }

    const proxyUrl = import.meta.env.PUBLIC_RELAYER_PROXY_URL;
    if (!proxyUrl) {
        throw new Error('Relayer proxy URL not configured');
    }

    const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Turnstile-Token': token,
        },
        body: JSON.stringify({ xdr }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Relayer proxy error: ${error}`);
    }

    return response.json();
}
