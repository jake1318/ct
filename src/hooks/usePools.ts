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

        console.log("API response data:", json.data);

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

        console.log("Stats map built:", statsMap);

        // Log all pool addresses to check for matches
        raw.forEach((p: any) => {
          const key = normalizeAddress(p.poolAddress);
          console.log(
            `Pool ${key} exists in stats: ${!!statsMap[key]}`,
            statsMap[key]
              ? `with data: ${JSON.stringify(statsMap[key])}`
              : "no data"
          );
        });

        // 3) merge on‑chain + off‑chain
        const mapped: PoolInfo[] = raw.map((p: any) => {
          const key = normalizeAddress(p.poolAddress);
          const stats = statsMap[key];

          // Extract token symbols
          const tokenASymbol = p.coinTypeA.split("::").pop()!;
          const tokenBSymbol = p.coinTypeB.split("::").pop()!;

          // Calculate fee rate from basis points
          const feeRate = Number(p.fee_rate) / 100;

          return {
            poolAddress: p.poolAddress,
            coinTypeA: p.coinTypeA,
            coinTypeB: p.coinTypeB,
            tokenA: { symbol: tokenASymbol },
            tokenB: { symbol: tokenBSymbol },
            feeRate: feeRate,
            liquidityUsd: stats?.liquidityUsd || 0,
            volume24hUsd: stats?.volume24hUsd || 0,
            fees24hUsd: stats?.fees24hUsd || 0,
            apr24h: stats?.apr24h || 0,
          };
        });

        console.log("mappedPools:", mapped);
        if (!canceled) setPools(mapped);
      } catch (e: any) {
        console.error("Error processing pool data:", e);
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
