/// <reference path="../.astro/types.d.ts" />

interface ImportMetaEnv {
    readonly PUBLIC_RPC_URL: string;
    readonly PUBLIC_NETWORK_PASSPHRASE: string;
    readonly PUBLIC_WALLET_WASM_HASH: string;
    // Dev only - direct relayer access
    readonly PUBLIC_RELAYER_URL?: string;
    readonly PUBLIC_RELAYER_API_KEY?: string;
    // Prod only - proxy with Turnstile auth
    readonly PUBLIC_RELAYER_PROXY_URL?: string;
    readonly PUBLIC_KALE_CONTRACT_ID: string;
    readonly PUBLIC_KALE_SAC_ID: string;
    readonly PUBLIC_FACTORY_CONTRACT_ID?: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
