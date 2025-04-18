import { useState, useEffect } from "react";
import cetusClmmSDK from "../services/cetusSdk";

export interface PoolInfo {
  poolAddress: string;
  coinTypeA: string;
  coinTypeB: string;
  tokenA: { symbol: string };
  tokenB: { symbol: string };
  apr24h: number;
}

export default function usePools() {
  const [pools, setPools] = useState<PoolInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const rawPools = await cetusClmmSDK.Pool.getPoolsWithPage([]);
        const res = await fetch("https://api-sui.cetus.zone/v2/sui/swap/count");
        const stats = await res.json();
        const aprMap: Record<string, number> = {};
        stats.data.pools.forEach((p: any) => {
          aprMap[p.pool_id] = p.apr_24h;
        });
        setPools(
          rawPools.map((p: any) => ({
            poolAddress: p.poolAddress,
            coinTypeA: p.coinTypeA,
            coinTypeB: p.coinTypeB,
            tokenA: { symbol: p.coinTypeA.split("::").pop() },
            tokenB: { symbol: p.coinTypeB.split("::").pop() },
            apr24h: aprMap[p.poolAddress] || 0,
          }))
        );
      } catch (e: any) {
        setError(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { pools, loading, error };
}
