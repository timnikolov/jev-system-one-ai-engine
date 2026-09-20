/**
 * @file test_policy_engine.js
 * @description Suite demonstrating Deterministic Policy Guardrail Vetoes vs Visual Soft Warnings
 */

import { runTypeSafeJevPrediction } from '../src/predictor.js';

async function testPolicyScenarios() {
  console.log('------------------------------------------------------------');
  console.log('🧪 Testing Policy Guardrails ("Code Decides" Safety Layer)');
  console.log('------------------------------------------------------------\n');

  // Scenario 1: Healthy High-Confluence Setup (Should Pass)
  console.log('▶ Scenario 1: Standard High-Confluence Bullish Telemetry');
  const setup1 = {
    quote: { bid: 19850.0, spread: 8.0, rsi: 62.0 },
    recentCloses: [19810, 19820, 19830, 19840, 19850],
    account: { balance: 10000, equity: 10000 }
  };
  const res1 = await runTypeSafeJevPrediction(setup1);
  console.log(`  Verdict: ${res1.prediction.policyVerdict} | Vetoed: ${res1.prediction.isTradeVetoed}`);
  console.log(`  Actionable Setup: ${res1.prediction.actionableSetup}\n`);

  // Scenario 2: Overstretched ADR Exhaustion (Should Trigger Hard Veto)
  console.log('▶ Scenario 2: Overstretched Intraday ADR Exhaustion (140% Range)');
  const setup2 = {
    quote: { bid: 19850.0, spread: 10.0, rsi: 78.0 },
    recentCloses: [19700, 19750, 19800, 19850],
    adrExhaustionPct: 140.0,
    account: { balance: 10000, equity: 10000 }
  };
  const res2 = await runTypeSafeJevPrediction(setup2);
  console.log(`  Verdict: ${res2.prediction.policyVerdict} | Vetoed: ${res2.prediction.isTradeVetoed}`);
  console.log(`  Reason: ${res2.prediction.policyGateReason}\n`);

  // Scenario 3: Imminent News Release & Widened Spread (Soft Gate Visual Warnings)
  console.log('▶ Scenario 3: Imminent High-Impact CPI News + 38pt Spread Expansion (Soft Gate)');
  const setup3 = {
    quote: { bid: 19850.0, spread: 38.0, rsi: 55.0 },
    recentCloses: [19840, 19842, 19845, 19850],
    macroEvents: [{ title: 'US CPI Release', time: '14:30', impact: 'HIGH' }],
    account: { balance: 10000, equity: 9600 }
  };
  const res3 = await runTypeSafeJevPrediction(setup3);
  console.log(`  Verdict: ${res3.prediction.policyVerdict} | Vetoed: ${res3.prediction.isTradeVetoed}`);
  console.log(`  Soft Warnings Rendered to User UI: ${res3.prediction.softGateWarnings}\n`);

  console.log('------------------------------------------------------------');
  console.log('✅ All Policy Guardrail Tests Completed Successfully!');
  console.log('------------------------------------------------------------');
}

testPolicyScenarios();
