import { ApolloClient } from "apollo-client";
import { InMemoryCache } from "apollo-cache-inmemory";
import { HttpLink } from "apollo-link-http";
import { useQuery } from "react-apollo";
import gql from "graphql-tag";
import { Link, Outlet } from "react-router-dom";
import './TableComponent.css'

export const client = new ApolloClient({
  link: new HttpLink({
    uri: "https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3",
  }),
  fetchOptions: {
    mode: "no-cors",
  },
  cache: new InMemoryCache(),
});



const LP_TVL = gql`
  {
    pools(first: 38, orderBy: totalValueLockedUSD, orderDirection: desc) {
      id
      totalValueLockedUSD
      token0 {
        symbol
      }
      token1 {
        symbol
      }
      liquidity
      feeTier
      volumeUSD
      poolDayData(first: 7, orderBy: date, orderDirection: desc) {
        date
        tvlUSD
        volumeUSD
      }
    }
  }
`;

var formatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",

  // These options are needed to round to whole numbers if that's what you want.
  minimumFractionDigits: 2,
  maximumFractionDigits: 3,
});

function averageVolumeWeek(poolDayData) {
  let volumeSum = 0;
  poolDayData.forEach((data) => {
    volumeSum += parseFloat(data.volumeUSD);
  });
  volumeSum = volumeSum / 7;
  return volumeSum;
}

function expo(x) {
  return Number.parseFloat(x).toExponential(3);
}

export default function TableComponent() {
  const { loading: lpLoading, data: lpData, error: lpError } = useQuery(LP_TVL);

  return (
    lpLoading && !lpError? (
        <div className="loading-screen">
            <div className="loading-screen-inner">
            <h2>Loading LP Data: </h2>
            <img
              src="https://i0.wp.com/css-tricks.com/wp-content/uploads/2021/08/s_2A9C470D38F43091CCD122E63014ED4503CAA7508FAF0C6806AE473C2B94B83E_1627522653545_loadinfo.gif?resize=200%2C200&amp;ssl=1"
              alt="loading"
            ></img>
            </div>
          
        </div>
      )
      :(
        <div className="table-container-outer">
    <h1>Liquidity Pools with TVL greater than $20 Million</h1>
    <table className="styled-table">
      <thead>
        <tr>
          <th>Index</th>
          <th>Swap</th>
          <th>Fee Tier(%)</th>
          {/* <th>Liquidity</th> */}
          <th>TVL($USD)</th>
          {/* <th>Change in TVL (24 hrs)</th>
            <th>Change in TVL (past week)</th>
            <th>Volume (USD) (All-time)</th>
            <th>Change in Volume (USD) (24 hrs)</th>
            <th>Change in Volume (USD) (average) (past week)</th> */}
          <th>Checkout More</th>
        
        </tr>
      </thead>
      <tbody>
         {
          lpData.pools.map((pool, index) => {
            if (index === 0) {
              return null;
            }
            return (
              <tr key={index}>
                <td>{index}</td>
                <td className="swap-td">{pool.token0.symbol} ⇆ {pool.token1.symbol}</td>
                <td>{parseInt(pool.feeTier) / 1000}%</td>
                {/* <td>{expo(pool.liquidity)}</td> */}
                <td>{formatter.format(pool.totalValueLockedUSD)}</td>
                {/* <td>{formatter.format(parseFloat(pool.totalValueLockedUSD) - parseFloat(pool.poolDayData[1].tvlUSD))}</td>
                  <td>{formatter.format(parseFloat(pool.poolDayData[0].tvlUSD) - parseFloat(pool.poolDayData[6].tvlUSD))}</td>
                  <td>{formatter.format(pool.volumeUSD)}</td>
                  <td>{formatter.format(parseFloat(pool.poolDayData[0].volumeUSD - parseFloat(pool.poolDayData[1].volumeUSD)) )}</td>
                  <td>{formatter.format(parseFloat( averageVolumeWeek(pool.poolDayData) - pool.poolDayData[6].volumeUSD))}</td> */}
                <td>
                  {
                    <Link to={`/dashboard/${pool.id}`} key={pool.id}>
                        <div className="learn-more">Learn More</div>
                    </Link>
                  }
                </td>
              </tr>
            );
            })
        }
            
      </tbody>
    </table>
    </div>
    )
  )
}
