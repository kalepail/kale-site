/// <reference path="../.astro/types.d.ts" />

interface ImportMetaEnv {
    readonly PUBLIC_RPC_URL: string;
    readonly PUBLIC_NETWORK_PASSPHRASE: string;
    readonly PUBLIC_FACTORY_CONTRACT_ID: string;
    readonly PUBLIC_LAUNCHTUBE_URL: string;
    readonly PUBLIC_LAUNCHTUBE_JWT: string;
    readonly PUBLIC_KALE_CONTRACT_ID: string;
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }