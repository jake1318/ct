import { initCetusSDK } from "@cetusprotocol/cetus-sui-clmm-sdk";

// Use the official Mysten Labs Sui mainnet full node endpoint
const cetusClmmSDK = initCetusSDK({
  network: "mainnet",
  fullNodeUrl: "https://fullnode.mainnet.sui.io:443",
});

export default cetusClmmSDK;
