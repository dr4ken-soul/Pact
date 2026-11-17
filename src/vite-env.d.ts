/// <reference types="vite/client" />
interface ImportMetaEnv { readonly VITE_PROJECT_DECK_URL:string; readonly VITE_PROJECT_REPOSITORY_URL:string; readonly VITE_EMBER2026_CASHTOKENS_ADDRESS:string; readonly VITE_BCH_NETWORK:string; readonly VITE_ENABLE_MAINNET_SENDS:string; readonly VITE_DEMO_RECIPIENT:string; readonly VITE_DEMO_AMOUNT_BCH:string; readonly VITE_MAINNET_ELECTRUM_HOST:string; readonly VITE_CHIPNET_ELECTRUM_HOST:string; }
interface ImportMeta { readonly env:ImportMetaEnv; }
