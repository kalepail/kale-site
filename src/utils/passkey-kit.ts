import { PasskeyKit, PasskeyServer, SACClient } from "passkey-kit";
import { version } from "../../package.json";

export function setLTHeaders(token: string) {
    server.launchtubeHeaders = {
        'X-Client-Name': 'web-kale-farmer',
        'X-Client-Version': version,
        'X-Turnstile-Response': token
    }
}

export const account = new PasskeyKit({
    rpcUrl: import.meta.env.PUBLIC_RPC_URL,
    networkPassphrase: import.meta.env.PUBLIC_NETWORK_PASSPHRASE,
    walletWasmHash: import.meta.env.PUBLIC_WALLET_WASM_HASH,
    timeoutInSeconds: 30,
});

export const server = new PasskeyServer({
    rpcUrl: import.meta.env.PUBLIC_RPC_URL,
    launchtubeUrl: import.meta.env.PUBLIC_LAUNCHTUBE_URL,
    launchtubeJwt: import.meta.env.PUBLIC_LAUNCHTUBE_JWT,
});

export const sac = new SACClient({
    rpcUrl: import.meta.env.PUBLIC_RPC_URL,
    networkPassphrase: import.meta.env.PUBLIC_NETWORK_PASSPHRASE,
});

export const kale = sac.getSACClient(import.meta.env.PUBLIC_KALE_SAC_ID);