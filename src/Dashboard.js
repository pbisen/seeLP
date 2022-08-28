import { Link } from "react-router-dom";
import { useParams } from "react-router-dom";
import { ApolloClient } from "apollo-client";
import { InMemoryCache } from "apollo-cache-inmemory";
import { HttpLink } from "apollo-link-http";
import { useQuery } from "react-apollo";
import gql from "graphql-tag";
import "./Dashboard.css";
import BarChart from "./BarChart";
import { useEffect, useState } from "react";
import LineChart from "./LineChart";
import { mean, standardDeviation } from "simple-statistics";

export const client = new ApolloClient({
  link: new HttpLink({
    uri: "https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3",
  }),
  fetchOptions: {
    mode: "no-cors",
  },
  cache: new InMemoryCache(),
});

const DAI_QUERY = gql`
  query tokens($tokenAddress: Bytes!) {
    tokens(where: { id: $tokenAddress }) {
      derivedETH
      totalLiquidity
    }
  }
`;

const LP_PARTICULAR = gql`
  query pool($poolID: Bytes!) {
    pool(id: $poolID) {
      id
      token0 {
        name
        symbol
        id
      }
      token1 {
        name
        symbol
        id
      }
      feeTier
      liquidity
      volumeToken0
      volumeToken1
      volumeUSD
      totalValueLockedETH
      totalValueLockedUSD
      poolDayData(first: 90, orderBy: date, orderDirection: desc) {
        date
        volumeUSD
        tvlUSD
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

function get24HourChange(poolDayData) {
  let todayVolume = parseFloat(poolDayData[1].volumeUSD);
  let yesterdayVolume = parseFloat(poolDayData[2].volumeUSD);
  let percentChange = ((todayVolume - yesterdayVolume) / yesterdayVolume) * 100;
  console.log("VOlume", todayVolume, yesterdayVolume, percentChange)
  return (
    <div className={percentChange > 0 ? "change-positive" : "change-negative"}>
      <h4>{percentChange.toFixed(3)} %</h4>
    </div>
  );
}

function getWeekChange(poolDayData) {
  let todayVolume = parseFloat(poolDayData[1].volumeUSD);
  let avgWeek = 0.0;
  poolDayData.forEach((day, index) => {
    if (index <= 6) {
      avgWeek += parseFloat(day.volumeUSD);
    }
  });
  avgWeek = avgWeek / 7;
  let percentChange = ((todayVolume - avgWeek) / avgWeek) * 100;

  return (
    <div className={percentChange > 0 ? "change-positive" : "change-negative"}>
      <h4>{percentChange.toFixed(3)} %</h4>
    </div>
  );
}

function getTvl24HourChange(poolDayData) {
  let todayTVL = parseFloat(poolDayData[1].tvlUSD);
  let yesterdayTVL = parseFloat(poolDayData[2].tvlUSD);
  let percentChange = ((todayTVL - yesterdayTVL) / yesterdayTVL) * 100;

  return (
    <div className={percentChange > 0 ? "change-positive" : "change-negative"}>
      <h4>{percentChange.toFixed(3)} %</h4>
    </div>
  );
}

function getTvl24HourValueChange(poolDayData) {
  let todayTVL = parseFloat(poolDayData[1].tvlUSD);
  let yesterdayTVL = parseFloat(poolDayData[2].tvlUSD);
  let valueChange = todayTVL - yesterdayTVL;

  return (
    <div className={valueChange > 0 ? "change-positive" : "change-negative"}>
      <h4>{formatter.format(valueChange)}</h4>
    </div>
  );
}

function getTvlWeekChange(poolDayData) {
  let todayTVL = parseFloat(poolDayData[1].tvlUSD);
  let weekTVL = parseFloat(poolDayData[7].tvlUSD);
  let percentChange = ((todayTVL - weekTVL) / weekTVL) * 100;

  return (
    <div className={percentChange > 0 ? "change-positive" : "change-negative"}>
      <h4>{percentChange.toFixed(3)} %</h4>
    </div>
  );
}

function getTvlWeekValueChange(poolDayData) {
  let todayTVL = parseFloat(poolDayData[1].tvlUSD);
  let weekTVL = parseFloat(poolDayData[7].tvlUSD);
  let valueChange = todayTVL - weekTVL;

  return (
    <div className={valueChange > 0 ? "change-positive" : "change-negative"}>
      <h4>{formatter.format(valueChange)}</h4>
    </div>
  );
}

function getVolumeGraphData(data) {
  data = data.splice(1, 31);

  let monthlyAvg = 0.0;

  data.forEach((day) => {
    monthlyAvg += parseFloat(day.volumeUSD);
  });

  monthlyAvg = monthlyAvg / 30;

  let changePercent =
    ((parseFloat(data[0].volumeUSD) - monthlyAvg) / monthlyAvg) * 100;
  let graphColor = changePercent > 0 ? "#A4DEAD" : "#FF9C9C";

  return {
    labels: data
      .map((day) => {
        let k = new Date(parseInt(day.date) * 1000);
        return k.toLocaleDateString();
      })
      .reverse(),
    datasets: [
      {
        label: "Volume ($)",
        data: data
          .map((day) => {
            return day.volumeUSD;
          })
          .reverse(),
        backgroundColor: [graphColor],
      },
    ],
  };
}

function getTVLGraphData(data) {
  data = data.slice(1, 31);

  let monthlyAvg = 0.0;

  data.forEach((day) => {
    monthlyAvg += parseFloat(day.tvlUSD);
  });

  monthlyAvg = monthlyAvg / 30;

  let changePercent =
    ((parseFloat(data[0].tvlUSD) - monthlyAvg) / monthlyAvg) * 100;
  let graphColor = changePercent > 0 ? "#A4DEAD" : "#FF9C9C";

  return {
    labels: data
      .map((day, index) => {
        let k = new Date(parseInt(day.date) * 1000);
        return k.toLocaleDateString();
      })
      .reverse(),
    datasets: [
      {
        label: "TVL ($)",
        data: data
          .map((day) => {
            return day.tvlUSD;
          })
          .reverse(),
        backgroundColor: [graphColor],
      },
    ],
  };
}

function capping100(input) {
  return 200 - input;
}

//LP-SAFE Queries

function getSafeScoreData(poolDayData) {
  let todayVolume = parseInt(poolDayData[1].volumeUSD);
  let yesterdayVolume = parseInt(poolDayData[2].volumeUSD);
  let volumeWeek = [];
  let volumeMonth1 = [];
  let volumeMonth2 = [];
  let volumeMonth3 = [];
  let volumeAll = [];
  let tvlToday = parseInt(poolDayData[1].tvlUSD);
  let tvlYesterday = parseInt(poolDayData[2].tvlUSD);
  let tvlWeek = [];
  let tvlMonth1 = [];
  let tvlMonth2 = [];
  let tvlMonth3 = [];
  let tvlAll = [];

  let percentageVolume24 =
    parseInt(((todayVolume - yesterdayVolume) / yesterdayVolume) * 100) + 100;
  let percentageTVL24 =
    parseInt(((tvlToday - tvlYesterday) / tvlYesterday) * 100) + 100;

  poolDayData.forEach((day, index) => {
    if (index >= 1 && index <= 7) {
      volumeWeek.push(parseInt(day.volumeUSD));
      tvlWeek.push(parseInt(day.tvlUSD));
    } else if (index >= 1 && index < 30) {
      volumeMonth1.push(parseInt(day.volumeUSD));
      tvlMonth1.push(parseInt(day.tvlUSD));
    } else if (index > 30 && index < 60) {
      volumeMonth2.push(parseInt(day.volumeUSD));
      tvlMonth2.push(parseInt(day.tvlUSD));
    } else if (index > 60 && index < 90) {
      volumeMonth3.push(parseInt(day.volumeUSD));
      tvlMonth3.push(parseInt(day.tvlUSD));
    } else {
    }
    volumeAll.push(parseInt(day.volumeUSD));
    tvlAll.push(parseInt(day.tvlUSD));
  });

  let scoreVolumeWeek =
    parseInt(((todayVolume - mean(volumeWeek)) / mean(volumeWeek)) * 100) + 100;
  let scoreTVLWeek =
    parseInt(((tvlToday - mean(tvlWeek)) / mean(tvlWeek)) * 100) + 100;

  let scoreVolumeMonth =
    parseInt(((todayVolume - mean(volumeMonth1)) / mean(volumeMonth1)) * 100) +
    100;

  let scoreTVLCoefficientMonth1 = capping100(
    parseInt((standardDeviation(tvlMonth1) / mean(tvlMonth1)) * 100)
  );
  let scoreTVLCoefficientMonth2 = capping100(
    parseInt((standardDeviation(tvlMonth2) / mean(tvlMonth2)) * 100)
  );
  let scoreTVLCoefficientMonth3 = capping100(
    parseInt((standardDeviation(tvlMonth3) / mean(tvlMonth3)) * 100)
  );

  let scoreTVLAllTime = capping100(
    parseInt((standardDeviation(tvlAll) / mean(tvlAll)) * 100)
  );

  let totalScore =
    percentageVolume24 +
    percentageTVL24 +
    scoreVolumeWeek +
    scoreTVLWeek +
    scoreVolumeMonth +
    scoreTVLCoefficientMonth1 +
    scoreTVLCoefficientMonth2 +
    scoreTVLCoefficientMonth3 +
    scoreTVLAllTime;

  return {
    percentageVolume24,
    percentageTVL24,
    scoreVolumeWeek,
    scoreTVLWeek,
    scoreVolumeMonth,
    scoreTVLCoefficientMonth1,
    scoreTVLCoefficientMonth2,
    scoreTVLCoefficientMonth3,
    scoreTVLAllTime,
    totalScore,
  };
}

function Dashboard({ match }) {
  let params = useParams();
  const {
    loading: lpLoading,
    data: lpData,
    error: lpError,
  } = useQuery(LP_PARTICULAR, {
    variables: {
      poolID: params.id,
    },
  });

  let safeDataScores = {};

  if (!lpLoading) {
    safeDataScores = getSafeScoreData(lpData.pool.poolDayData);
  }

  return (
    <div className="dashboard-wrapper">
      <div className="dashboard-header">
        <h1>seeLP</h1>
        <Link to="/">
          <div className="header-back-button">Back To Homepage</div>
        </Link>
      </div>
      <div className="dashboard-body">
        {lpLoading && !lpError ? (
          <div className="loading-container">
            <h1>Loading</h1>
            <img
              src="https://i0.wp.com/css-tricks.com/wp-content/uploads/2021/08/s_2A9C470D38F43091CCD122E63014ED4503CAA7508FAF0C6806AE473C2B94B83E_1627522653545_loadinfo.gif?resize=200%2C200&amp;ssl=1"
              alt="loading"
            ></img>
          </div>
        ) : (
          <div className="pool-container">
            <div className="pool-info">
              <div className="pool-general-info">
                <h1>Swap Name</h1>
                <br></br>
                <h2>
                  {lpData.pool.token0.symbol} ⇆ {lpData.pool.token1.symbol}
                </h2>
              </div>
              <div className="pool-fee-info">
                <h1>Fee Tier</h1>
                <br></br>
                <h2>{parseInt(lpData.pool.feeTier) / 10000} %</h2>
              </div>
              <div className="pool-tvl-info">
                <div className="pool-tvl-description">
                  <h1>Total Value Locked</h1>
                </div>

                <div className="pool-tvl-container">
                  <div className="pool-tvl-inner">
                    <h2>ETH</h2>
                    <h3>
                      ⧫ {parseFloat(lpData.pool.totalValueLockedETH).toFixed(4)}
                    </h3>
                  </div>
                  <div className="pool-tvl-inner">
                    <h2>USD</h2>
                    <h3>{formatter.format(lpData.pool.totalValueLockedUSD)}</h3>
                  </div>
                </div>
                <div className="pool-tvl-historical">
                  <div className="pool-tvl-24">
                    <h3>24 Hours</h3>
                    <div className="pool-tvl-24-data">
                      <div className="pool-tvl-24-percent">
                        <h4>% Change</h4>
                        {getTvl24HourChange(lpData.pool.poolDayData)}
                      </div>
                      <div className="pool-tvl-24-value">
                        <h4>$ Change</h4>

                        {getTvl24HourValueChange(lpData.pool.poolDayData)}
                      </div>
                    </div>
                  </div>
                  <div className="pool-tvl-24">
                    <h3>Past Week</h3>
                    <div className="pool-tvl-24-data">
                      <div className="pool-tvl-24-percent">
                        <h4>% Change</h4>
                        {getTvlWeekChange(lpData.pool.poolDayData)}
                      </div>
                      <div className="pool-tvl-24-value">
                        <h4>$ Change</h4>
                        {getTvlWeekValueChange(lpData.pool.poolDayData)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pool-tvl-month">
                  <div className="volume-month-header">
                    <h2>Past Month Trend</h2>
                  </div>
                  <LineChart
                    chartData={getTVLGraphData(lpData.pool.poolDayData)}
                  />
                </div>
              </div>
              <div className="pool-volume-wrapper">
                <div className="pool-volume-description">
                  <h1>Trading Volume</h1>
                </div>
                <div className="pool-volume-alltime">
                  <h2>All-Time</h2>
                  <br></br>
                  <h3>{formatter.format(lpData.pool.volumeUSD)}</h3>
                </div>
                <div className="pool-volume-change">
                  <div className="pool-volume-24">
                    <h3>% Change (24 hr)</h3>

                    {get24HourChange(lpData.pool.poolDayData)}
                  </div>
                  <div className="pool-volume-week">
                    <h3>% Change (past week)</h3>

                    {getWeekChange(lpData.pool.poolDayData)}
                  </div>
                </div>
                <div className="pool-volume-month">
                  <div className="volume-month-header">
                    <h2>Past Month Trend</h2>
                  </div>
                  <BarChart
                    chartData={getVolumeGraphData(lpData.pool.poolDayData)}
                  />
                </div>
              </div>
            </div>
            <div className="pool-score-container">
              <div className="pool-score-header">
                <h1>SAFE Score (BETA)</h1>
              </div>
              {!lpLoading ? (
                <div className="score-content">
                  <table>
                    <thead>
                      <th>Description</th>
                      <th>Score (out of 200)</th>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Volume Change(past 24 hours)</td>
                        <td>{safeDataScores.percentageVolume24}</td>
                      </tr>
                      <tr>
                        <td>TVL Change(past 24 hours)</td>
                        <td>{safeDataScores.percentageTVL24}</td>
                      </tr>
                      <tr>
                        <td>Variation Score - Volume (past week)</td>
                        <td>{safeDataScores.scoreVolumeWeek}</td>
                      </tr>
                      <tr>
                        <td>Variation Score - TVL (week)</td>
                        <td>{safeDataScores.scoreTVLWeek}</td>
                      </tr>
                      <tr>
                        <td>Volume Change (past Month)</td>
                        <td>{safeDataScores.scoreVolumeMonth}</td>
                      </tr>
                      <tr>
                        <td>Variation Score - TVL (1 month back)</td>
                        <td>{safeDataScores.scoreTVLCoefficientMonth1}</td>
                      </tr>
                      <tr>
                        <td>Variation Score - TVL (2 months back)</td>
                        <td>{safeDataScores.scoreTVLCoefficientMonth2}</td>
                      </tr>
                      <tr>
                        <td>Variation Score - Volume (3 months back)</td>
                        <td>{safeDataScores.scoreTVLCoefficientMonth3}</td>
                      </tr>
                      <tr>
                        <td>Variation Score - TVL (All Time)</td>
                        <td>{safeDataScores.scoreTVLAllTime}</td>
                      </tr>
                    </tbody>
                  </table>
                  <div className="total-score">
                    <h2>Total Score</h2>
                    <h1>{safeDataScores.totalScore}/1800</h1>
                  </div>
                  <a
                    href={`https://app.uniswap.org/#/add/${lpData.pool.token0.id}/${lpData.pool.token1.id}/`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <div className="invest">
                      <h2>Invest on UniSwap</h2>
                    </div>
                  </a>
                </div>
              ) : (
                <div>Loading</div>
              )}
            </div>
          </div>
        )}
      </div>
      <div className="dashboard-footer">
      </div>
    </div>
  );
}

export default Dashboard;
