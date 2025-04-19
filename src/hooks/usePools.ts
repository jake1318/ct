// src/hooks/usePools.ts
import { useState, useEffect } from "react";
import { getAllPools, getPoolsByIds } from "../services/poolActions";

export interface PoolInfo {
  poolAddress: string;
  coinTypeA: string;
  coinTypeB: string;
  tokenA: { symbol: string };
  tokenB: { symbol: string };
  feeRate: number; // e.g. 25 = 25%
  apr24h: number; // %
  liquidityUsd: number; // USD
  volume24hUsd: number; // USD
  fees24hUsd: number; // USD
}

// helper to ensure every address is "0x" + lowercase
function normalizeAddress(addr: string): string {
  const s = addr.toLowerCase();
  return s.startsWith("0x") ? s : "0x" + s;
}

export default function usePools(filterIds?: string[]) {
  const [pools, setPools] = useState<PoolInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let canceled = false;

    (async () => {
      setLoading(true);
      try {
        // 1) on‑chain fetch
        const raw =
          filterIds && filterIds.length
            ? await getPoolsByIds(filterIds)
            : await getAllPools();
        console.log("rawPools:", raw);

        // 2) off‑chain stats from Cetus Stats API
        const resp = await fetch(
          "https://api-sui.cetus.zone/v2/sui/pools_info"
        );
        const json = await resp.json();
        const list: any[] = json.data?.lp_list || [];

        // build a lookup map keyed by normalized address
        const statsMap: Record<
          string,
          {
            liquidityUsd: number;
            volume24hUsd: number;
            fees24hUsd: number;
            apr24h: number;
          }
        > = {};

        list.forEach((p) => {
          if (!p.address) return;
          const key = normalizeAddress(p.address);
          statsMap[key] = {
            liquidityUsd: Number(p.depth) || 0,
            volume24hUsd: Number(p.volume_24h) || 0,
            fees24hUsd: Number(p.fee_24h) || 0,
            apr24h: Number(p.apr_24h) || 0,
          };
        });

        // 3) merge on‑chain + off‑chain
        const mapped: PoolInfo[] = raw.map((p: any) => {
          const key = normalizeAddress(p.poolAddress);
          const s = statsMap[key];
          if (!s) {
            // if something really isn't in the stats map, throw
            throw new Error(`Missing stats for pool ${key}`);
          }
          return {
            poolAddress: p.poolAddress,
            coinTypeA: p.coinTypeA,
            coinTypeB: p.coinTypeB,
            tokenA: { symbol: p.coinTypeA.split("::").pop()! },
            tokenB: { symbol: p.coinTypeB.split("::").pop()! },
            feeRate: Number(p.fee_rate) / 100, // 2500 → 25%
            liquidityUsd: s.liquidityUsd,
            volume24hUsd: s.volume24hUsd,
            fees24hUsd: s.fees24hUsd,
            apr24h: s.apr24h,
          };
        });

        console.log("mappedPools:", mapped);
        if (!canceled) setPools(mapped);
      } catch (e: any) {
        if (!canceled) setError(e);
      } finally {
        if (!canceled) setLoading(false);
      }
    })();

    return () => {
      canceled = true;
    };
  }, [filterIds]);

  return { pools, loading, error };
}
