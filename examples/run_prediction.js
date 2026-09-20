/**
 * @file run_prediction.js
 * @description Standalone runnable demo script demonstrating end-to-end System One prediction & evaluation
 */

import { runTypeSafeJevPrediction } from '../src/predictor.js';

async function main() {
  console.log('----------------------------------------------------');
  console.log('🤖 Running TypeSafe Jev System One AI Engine Demo...');
  console.log('----------------------------------------------------\n');

  // Simulated USTEC 15-Minute Telemetry Payload
  const sampleMarketState = {
    symbol: 'USTEC (US Tech 100 Index Futures)',
    quote: {
      bid: 19850.50,
      ask: 19851.50,
      spread: 10.0,
      rsi: 68.4,
      macd: 12.5
    },
    positionsAnalysis: {
      atr: 42.5
    },
    recentCloses: [
      19810.0, 19815.5, 19822.0, 19828.4, 19835.0,
      19832.1, 19840.0, 19844.5, 19848.0, 19850.5
    ],
    rsiSequence: [52.0, 54.5, 57.1, 60.2, 62.8, 64.0, 65.5, 66.8, 67.9, 68.4],
    account: {
      balance: 25000.0,
      equity: 24850.0
    },
    macroEvents: [
      { title: 'US Core CPI YoY', time: '14:30', impact: 'HIGH' }
    ]
  };

  const result = await runTypeSafeJevPrediction(sampleMarketState);

  console.log('\n📊 [Prediction Output Result]:');
  console.log(JSON.stringify(result.prediction, null, 2));

  console.log('\n🛡️ [Soft Gate Warnings Visualized]:');
  console.log('Warnings:', result.prediction.softGateWarnings);

  console.log('\n⚖️ [Deterministic Policy Verdict]:');
  console.log('Verdict:', result.prediction.policyVerdict);
  console.log('Vetoed:', result.prediction.isTradeVetoed);
  console.log('Actionable Setup:', result.prediction.actionableSetup);

  console.log('\n----------------------------------------------------');
  console.log('✅ Demo Execution Finished Successfully!');
  console.log('----------------------------------------------------');
}

main();
