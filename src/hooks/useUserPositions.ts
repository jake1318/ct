import { useState, useEffect } from "react";
import { useWallet } from "@suiet/wallet-kit";
import cetusClmmSDK from "../services/cetusSdk";

interface PositionInfo {
  positionId: string;
  pendingRewards: number;
}

type PositionsMap = Record<string, PositionInfo[]>;

export default function useUserPositions(pools: { poolAddress: string }[]) {
  const wallet = useWallet();
  const [positions, setPositions] = useState<PositionsMap>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      if (!wallet.connected || !wallet.account?.address) {
        setPositions({});
        return;
      }
      setLoading(true);

      const map: PositionsMap = {};
      for (const pool of pools) {
        const posList = await cetusClmmSDK.Position.getPositionList(
          wallet.account.address,
          [pool.poolAddress]
        );
        if (posList.length) {
          map[pool.poolAddress] = posList.map((pos: any) => {
            const total =
              pos.rewarder_amount_vector?.reduce(
                (sum: number, r: any) => sum + parseFloat(r.amount_owed),
                0
              ) ?? 0;
            return { positionId: pos.pos_object_id, pendingRewards: total };
          });
        }
      }

      setPositions(map);
      setLoading(false);
    })();
  }, [wallet.account?.address, wallet.connected, pools]);

  return { positions, loading };
}
