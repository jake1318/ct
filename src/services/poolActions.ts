import cetusClmmSDK from "./cetusSdk";
import { AggregatorClient } from "@cetusprotocol/aggregator-sdk";
import type { WalletContextState } from "@suiet/wallet-kit";
import { Transaction } from "@mysten/sui/transactions";

const aggregator = new AggregatorClient({ network: "mainnet" });

/** Fetch all pools (paginated internally). */
export async function getAllPools() {
  return await cetusClmmSDK.Pool.getPoolsWithPage([]);
}

/** Batch fetch multiple pools by an array of pool IDs. */
export async function getPoolsByIds(poolIds: string[]) {
  // Use individual getPool calls to avoid any page‑size limits
  return Promise.all(poolIds.map((id) => cetusClmmSDK.Pool.getPool(id)));
}

/** Fetch exactly one pool by its ID. */
export async function getPoolById(poolId: string) {
  return await cetusClmmSDK.Pool.getPool(poolId);
}

/** Deposit liquidity (open new or add to existing position). */
export async function depositLiquidity(
  poolId: string,
  amountA: number,
  amountB: number,
  wallet: WalletContextState,
  posId?: string
) {
  const pool = await cetusClmmSDK.Pool.getPool(poolId);
  const isNew = !posId;
  const params: any = {
    pool_id: pool.poolAddress,
    coinTypeA: pool.coinTypeA,
    coinTypeB: pool.coinTypeB,
    amount_a: amountA.toString(),
    amount_b: amountB.toString(),
    slippage: 0.01,
    is_open: isNew,
  };

  if (isNew) {
    // full‑range ticks by default
    const s = Number(pool.tickSpacing);
    const MIN = -887272,
      MAX = 887272;
    params.tick_lower = Math.floor(MIN / s) * s;
    params.tick_upper = Math.floor(MAX / s) * s;
  } else {
    params.pos_id = posId;
    params.is_open = false;
  }

  const tx = new Transaction();
  cetusClmmSDK.Position.createAddLiquidityPayload(params, tx);
  return await wallet.signAndExecuteTransaction({ transaction: tx });
}

/** Remove all liquidity from a position and collect trading fees. */
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
  const tx = new Transaction();
  cetusClmmSDK.Position.removeLiquidityPayload(params, tx);
  return await wallet.signAndExecuteTransaction({ transaction: tx });
}

/** Claim pending reward tokens without changing liquidity. */
export async function collectRewards(
  positionId: string,
  wallet: WalletContextState
) {
  const pos = await cetusClmmSDK.Position.getPositionInfo(positionId);
  const pool = await cetusClmmSDK.Pool.getPool(pos.pool_id);
  const reps = await cetusClmmSDK.Rewarder.posRewardersAmount(
    pool.poolAddress,
    pool.position_manager.positions_handle,
    positionId
  );
  const rewarder_coin_types = reps
    .filter((r) => Number(r.amount_owed) > 0)
    .map((r) => r.coin_address);

  const params = {
    pool_id: pool.poolAddress,
    pos_id: positionId,
    coinTypeA: pool.coinTypeA,
    coinTypeB: pool.coinTypeB,
    rewarder_coin_types,
    collect_fee: false,
  };
  const tx = new Transaction();
  cetusClmmSDK.Rewarder.collectRewarderTransactionPayload(params, tx);
  return await wallet.signAndExecuteTransaction({ transaction: tx });
}

/** Swap tokens using Cetus Smart Router v2. */
export async function swapTokens(
  amountIn: bigint,
  fromCoinType: string,
  toCoinType: string,
  wallet: WalletContextState
) {
  const routeRes = await aggregator.findRouters({
    from: fromCoinType,
    target: toCoinType,
    amount: amountIn,
    byAmountIn: true,
  });
  if (!routeRes || routeRes.routes.length === 0) {
    throw new Error("No swap route found");
  }
  const tx = new Transaction();
  await aggregator.fastRouterSwap({
    routers: routeRes.routes,
    byAmountIn: true,
    txb: tx,
    slippage: 0.01,
    refreshAllCoins: true,
  });
  return await wallet.signAndExecuteTransaction({ transaction: tx });
}
