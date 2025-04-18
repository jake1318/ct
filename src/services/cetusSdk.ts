import { initCetusSDK } from "@cetusprotocol/cetus-sui-clmm-sdk";

const cetusClmmSDK = initCetusSDK({
  network: "mainnet",
  fullNodeUrl: "https://rpc.mainnet.sui.io:443",
});

export default cetusClmmSDK;
