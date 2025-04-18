import React, { useState } from "react";
import { useWallet } from "@suiet/wallet-kit";
import usePools from "../hooks/usePools";
import useUserPositions from "../hooks/useUserPositions";
import {
  depositLiquidity,
  removeLiquidity,
  collectRewards,
} from "../services/poolActions";
import "../styles/PoolsPage.scss";

const Pools: React.FC = () => {
  const { pools, loading: poolsLoading, error } = usePools();
  const { positions, loading: posLoading } = useUserPositions(pools);
  const wallet = useWallet();
  const [depositValues, setDepositValues] = useState<
    Record<string, { a: number; b: number }>
  >({});

  if (poolsLoading) return <div>Loading pools...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="pools-page">
      <h1>Liquidity Pools</h1>
      <table>
        <thead>
          <tr>
            <th>Pool</th>
            <th>APR 24h</th>
            <th>Pending Rewards</th>
            <th>Deposit</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {pools.map((pool) => {
            const userPos = positions[pool.poolAddress] || [];
            const pendingRewards = userPos.reduce(
              (sum, p) => sum + p.pendingRewards,
              0
            );
            const deposit = depositValues[pool.poolAddress] || { a: 0, b: 0 };

            return (
              <tr key={pool.poolAddress}>
                <td>
                  {pool.tokenA.symbol}/{pool.tokenB.symbol}
                </td>
                <td>{pool.apr24h.toFixed(2)}%</td>
                <td>{pendingRewards.toFixed(4)}</td>
                <td>
                  <input
                    type="number"
                    placeholder={`${pool.tokenA.symbol}`}
                    value={deposit.a || ""}
                    onChange={(e) =>
                      setDepositValues((v) => ({
                        ...v,
                        [pool.poolAddress]: {
                          ...v[pool.poolAddress],
                          a: parseFloat(e.target.value),
                        },
                      }))
                    }
                  />
                  <input
                    type="number"
                    placeholder={`${pool.tokenB.symbol}`}
                    value={deposit.b || ""}
                    onChange={(e) =>
                      setDepositValues((v) => ({
                        ...v,
                        [pool.poolAddress]: {
                          ...v[pool.poolAddress],
                          b: parseFloat(e.target.value),
                        },
                      }))
                    }
                  />
                  <button
                    disabled={!wallet.connected}
                    onClick={() =>
                      depositLiquidity(
                        pool.poolAddress,
                        deposit.a,
                        deposit.b,
                        wallet
                      )
                    }
                  >
                    Deposit
                  </button>
                </td>
                <td>
                  {userPos.length
                    ? userPos.map((pos) => (
                        <div key={pos.positionId} className="pos-actions">
                          <button
                            disabled={!wallet.connected}
                            onClick={() =>
                              removeLiquidity(pos.positionId, wallet)
                            }
                          >
                            Withdraw
                          </button>
                          <button
                            disabled={!wallet.connected}
                            onClick={() =>
                              collectRewards(pos.positionId, wallet)
                            }
                          >
                            Collect
                          </button>
                        </div>
                      ))
                    : "-"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default Pools;
