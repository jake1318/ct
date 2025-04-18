import cetusClmmSDK from "./cetusSdk";
import type { WalletContextState } from "@suiet/wallet-kit";

export async function depositLiquidity(
  poolId: string,
  amountA: number,
  amountB: number,
  wallet: WalletContextState
) {
  const pool = await cetusClmmSDK.Pool.getPool(poolId);
  const params = {
    pool_id: pool.poolAddress,
    coinTypeA: pool.coinTypeA,
    coinTypeB: pool.coinTypeB,
    amount_a: amountA.toString(),
    amount_b: amountB.toString(),
    slippage: 0.01,
    is_open: true,
  };
  const txBlock = await cetusClmmSDK.Position.createAddLiquidityPayload(params);
  return wallet.signAndExecuteTransactionBlock({ transactionBlock: txBlock });
}

export async function removeLiquidity(
  positionId: string,
  wallet: WalletContextState
) {
  const pos = await cetusClmmSDK.Position.getPositionInfo(positionId);
  const params = {
    pool_id: pos.pool_id,
    pos_id: positionId,
    delta_liquidity: pos.liquidity,
    min_amount_a: "0",
    min_amount_b: "0",
    collect_fee: true,
  };
  const txBlock = await cetusClmmSDK.Position.removeLiquidityPayload(params);
  return wallet.signAndExecuteTransactionBlock({ transactionBlock: txBlock });
}

export async function collectRewards(
  positionId: string,
  wallet: WalletContextState
) {
  const pos = await cetusClmmSDK.Position.getPositionInfo(positionId);
  const rewards = await cetusClmmSDK.Rewarder.posRewardersAmount(
    pos.pool_id,
    positionId
  );
  const rewarder_coin_types = rewards
    .filter((r: any) => BigInt(r.amount_owed) > 0n)
    .map((r: any) => r.coin_address);

  const params = {
    pool_id: pos.pool_id,
    pos_id: positionId,
    rewarder_coin_types,
    collect_fee: false,
  };
  const txBlock = await cetusClmmSDK.Rewarder.collectRewarderPayload(params);
  return wallet.signAndExecuteTransactionBlock({ transactionBlock: txBlock });
}
