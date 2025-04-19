import React, { useState } from "react";
import { useWallet } from "@suiet/wallet-kit";
import usePools, { PoolInfo } from "../hooks/usePools";
import useUserPositions from "../hooks/useUserPositions";
import {
  depositLiquidity,
  removeLiquidity,
  collectRewards,
} from "../services/poolActions";
import "../styles/PoolsPage.scss";

// ← full list of your 10 pools
const SPECIFIC_IDS = [
  "0xb8d7d9e66a60c239e7a60110efcf8de6c705580ed924d0dde141f4a0e2c90105",
  "0x72f5c6eef73d77de271886219a2543e7c29a33de19a6c69c5cf1899f729c3f17",
  "0x7df346f8ef98ad20869ff6d2fc7c43c00403a524987509091b39ce61dde00957",
  "0xe01243f37f712ef87e556afb9b1d03d0fae13f96d324ec912daffc339dfdcbd2",
  "0x2e041f3fd93646dcc877f783c1f2b7fa62d30271bdef1f21ef002cebf857bded",
  "0xb785e6eed355c1f8367c06d2b0cb9303ab167f8359a129bb003891ee54c6fce0",
  "0x2fc6ee9183d0f1ca0d2dded02c416be6f4671bb82db55c26ce12b536812a4b8e",
  "0x0254747f5ca059a1972cd7f6016485d51392a3fde608107b93bbaebea550f703",
  "0xaa020ad81e1621d98d4fb82c4acb80dc064722f24ef828ab633bef50fc28268b",
  "0x871d8a227114f375170f149f7e9d45be822dd003eba225e83c05ac80828596bc",
];

const Pools: React.FC = () => {
  const { pools, loading: poolsLoading, error } = usePools(SPECIFIC_IDS);
  const { positions } = useUserPositions(pools);
  const wallet = useWallet();
  const [depositValues, setDepositValues] = useState<
    Record<string, { a: number; b: number }>
  >({});

  if (poolsLoading) return <div>Loading pools…</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="pools-page">
      <h1>Liquidity Pools</h1>
      <table>
        <thead>
          <tr>
            <th>Pool (Fee)</th>
            <th>Liquidity (USD)</th>
            <th>Volume 24h (USD)</th>
            <th>Fees 24h (USD)</th>
            <th>APR 24h</th>
            <th>Pending Rewards</th>
            <th>Deposit</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {pools.map((pool: PoolInfo) => {
            const userPos = positions[pool.poolAddress] || [];
            const pendingRewards = userPos.reduce(
              (sum, p) => sum + p.pendingRewards,
              0
            );
            const deposit = depositValues[pool.poolAddress] || { a: 0, b: 0 };

            return (
              <tr key={pool.poolAddress}>
                <td>
                  {pool.tokenA.symbol}/{pool.tokenB.symbol} (
                  {pool.feeRate.toFixed(2)}%)
                </td>
                <td>
                  {pool.liquidityUsd.toLocaleString("en-US", {
                    style: "currency",
                    currency: "USD",
                  })}
                </td>
                <td>
                  {pool.volume24hUsd.toLocaleString("en-US", {
                    style: "currency",
                    currency: "USD",
                  })}
                </td>
                <td>
                  {pool.fees24hUsd.toLocaleString("en-US", {
                    style: "currency",
                    currency: "USD",
                  })}
                </td>
                <td>{pool.apr24h.toFixed(2)}%</td>
                <td>{pendingRewards.toFixed(4)}</td>
                <td>
                  <input
                    type="number"
                    placeholder={pool.tokenA.symbol}
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
                    placeholder={pool.tokenB.symbol}
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
                    : "–"}
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
