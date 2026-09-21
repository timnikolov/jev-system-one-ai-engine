/**
 * @file database.js
 * @description SQLite Storage & Quantitative Accuracy Evaluation Engine for System One AI Predictions
 */

import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '..', 'predictions.db');

// Initialize Database Connection & Tables
export function initDatabase() {
  try {
    createTables();
    console.log('✅ [System One DB] SQLite Database initialized at:', DB_PATH);
  } catch (err) {
    console.error('❌ [System One DB] Error initializing DB:', err.message);
  }
}

function runSQL(sql) {
  try {
    const sanitized = sql.trim();
    if (!sanitized) return;
    
    // SQLite CLI fallback execution
    const escapedSQL = sanitized.replace(/"/g, '\\"');
    execSync(`sqlite3 "${DB_PATH}" "${escapedSQL}"`, { stdio: 'pipe' });
  } catch (err) {
    console.error('SQL Execution Error:', err.message, 'SQL:', sql.slice(0, 100));
  }
}

function querySQLJSON(sql) {
  try {
    const escapedSQL = sql.replace(/"/g, '\\"');
    const stdout = execSync(`sqlite3 -json "${DB_PATH}" "${escapedSQL}"`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
    if (!stdout || !stdout.trim()) return [];
    return JSON.parse(stdout.trim());
  } catch (err) {
    return [];
  }
}

function createTables() {
  const sql = `
    CREATE TABLE IF NOT EXISTS typesafe_predictions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT NOT NULL,
      timeframe TEXT NOT NULL DEFAULT 'M15',
      predicted_score REAL NOT NULL DEFAULT 3.0,
      predicted_direction TEXT NOT NULL DEFAULT 'NEUTRAL',
      predicted_magnitude TEXT NOT NULL DEFAULT 'MODERATE',
      predicted_delta_range TEXT NOT NULL,
      market_regime TEXT NOT NULL DEFAULT 'RANGE_ACCUMULATION_ZONE_A',
      confidence REAL NOT NULL DEFAULT 0.85,
      signal_quality_score REAL DEFAULT 4.0,
      market_toxicity_prob REAL DEFAULT 0.15,
      regime_transition_prob REAL DEFAULT 0.20,
      policy_verdict TEXT DEFAULT 'APPROVED_TRADE_EXECUTION',
      policy_gate_reason TEXT DEFAULT 'High Confluence Setup Passed',
      is_trade_vetoed INTEGER DEFAULT 0,
      actionable_setup TEXT NOT NULL DEFAULT 'NEUTRAL',
      soft_gate_warnings TEXT DEFAULT 'NONE',
      prediction_source TEXT NOT NULL DEFAULT 'TYPESAFE_CLOUD_JEV',
      historical_snapshot TEXT,
      input_payload TEXT,
      start_price REAL DEFAULT 0.0,
      target_close_timestamp INTEGER,
      actual_close_price REAL DEFAULT 0.0,
      actual_direction TEXT DEFAULT 'PENDING',
      actual_delta_points REAL DEFAULT 0.0,
      is_direction_hit INTEGER DEFAULT 0,
      accuracy_score REAL DEFAULT 0.0,
      status TEXT DEFAULT 'PENDING'
    );
  `;
  runSQL(sql);
}

/**
 * Store a new System One AI prediction record
 */
export function insertPrediction(p) {
  const targetTs = parseInt(p.targetCloseTimestamp, 10) || (Date.now() + 900000);
  const timestamp = p.timestamp || new Date().toISOString();
  const source = p.predictionSource || 'TYPESAFE_CLOUD_JEV';

  const sql = `
    INSERT INTO typesafe_predictions (
      timestamp, timeframe, predicted_score, predicted_direction, predicted_magnitude,
      predicted_delta_range, market_regime, confidence, signal_quality_score,
      market_toxicity_prob, regime_transition_prob, policy_verdict, policy_gate_reason,
      is_trade_vetoed, actionable_setup, soft_gate_warnings, prediction_source,
      historical_snapshot, input_payload, start_price, target_close_timestamp, status
    ) VALUES (
      '${timestamp}', '${p.timeframe || 'M15'}', ${parseFloat(p.predictedScore) || 3.0},
      '${p.predictedDirection || 'NEUTRAL'}', '${p.predictedMagnitude || 'MODERATE'}',
      '${(p.predictedDeltaRange || '').replace(/'/g, "''")}', '${(p.marketRegime || 'RANGE_ACCUMULATION_ZONE_A').replace(/'/g, "''")}',
      ${parseFloat(p.confidence) || 0.85}, ${parseFloat(p.signalQualityScore) || 4.0},
      ${parseFloat(p.marketToxicityProb) || 0.15}, ${parseFloat(p.regimeTransitionProb) || 0.20},
      '${(p.policyVerdict || 'APPROVED_TRADE_EXECUTION').replace(/'/g, "''")}',
      '${(p.policyGateReason || 'High Confluence Setup Passed').replace(/'/g, "''")}',
      ${p.isTradeVetoed ? 1 : 0}, '${(p.actionableSetup || 'NEUTRAL').replace(/'/g, "''")}',
      '${(p.softGateWarnings || 'NONE').replace(/'/g, "''")}', '${source.replace(/'/g, "''")}',
      '${(p.historicalSnapshot || '[]').replace(/'/g, "''")}', '${(p.inputPayload || '{}').replace(/'/g, "''")}',
      ${parseFloat(p.startPrice) || 0.0}, ${targetTs}, 'PENDING'
    );
  `;
  runSQL(sql);
}

/**
 * Fetch pending predictions ready for close price evaluation
 */
export function getPendingPredictions() {
  const nowMs = Date.now();
  const sql = `SELECT * FROM typesafe_predictions WHERE status = 'PENDING' AND target_close_timestamp <= ${nowMs};`;
  return querySQLJSON(sql);
}

/**
 * Evaluate pending prediction against actual market close price
 */
export function evaluatePrediction(id, actualClosePrice, actualDirection, actualDeltaPts, isDirectionHit, accuracyScore) {
  const sql = `
    UPDATE typesafe_predictions SET
      actual_close_price = ${parseFloat(actualClosePrice) || 0.0},
      actual_direction = '${actualDirection || 'NEUTRAL'}',
      actual_delta_points = ${+parseFloat(actualDeltaPts || 0).toFixed(2)},
      is_direction_hit = ${isDirectionHit ? 1 : 0},
      accuracy_score = ${+parseFloat(accuracyScore || 0).toFixed(1)},
      status = 'EVALUATED'
    WHERE id = ${parseInt(id, 10)};
  `;
  runSQL(sql);
}

/**
 * Get prediction history list
 */
export function getPredictionsHistory(limit = 50) {
  const sql = `SELECT * FROM typesafe_predictions ORDER BY id DESC LIMIT ${parseInt(limit, 10)};`;
  return querySQLJSON(sql);
}

/**
 * Calculate quantitative accuracy metrics
 */
export function getAccuracyStats() {
  const evaluated = querySQLJSON(`SELECT * FROM typesafe_predictions WHERE status = 'EVALUATED';`);
  const totalEvaluated = evaluated.length;

  if (totalEvaluated === 0) {
    return {
      totalEvaluated: 0,
      activeForecastsTotal: 0,
      vetoedTotal: 0,
      directionHitCount: 0,
      directionHitRatePct: 0.0,
      actionableTotal: 0,
      actionableHitCount: 0,
      actionableHitRatePct: 0.0,
      avgAccuracyScore: 0.0,
      meanAbsoluteErrorPts: 0.0,
      latestPrediction: querySQLJSON(`SELECT * FROM typesafe_predictions ORDER BY id DESC LIMIT 1;`)[0] || null
    };
  }

  let hitCount = 0;
  let sumAccuracy = 0;
  let sumAbsError = 0;
  let actionableTotal = 0;
  let actionableHitCount = 0;
  let activeForecastsTotal = 0;
  let vetoedTotal = 0;

  evaluated.forEach(p => {
    const isVetoed = p.is_trade_vetoed === 1 ||
                     p.is_trade_vetoed === true ||
                     (p.policy_verdict || '').startsWith('VETO') ||
                     (p.actionable_setup || '').startsWith('NO');

    if (isVetoed) {
      vetoedTotal++;
    } else {
      activeForecastsTotal++;
      if (p.is_direction_hit === 1) hitCount++;
      sumAccuracy += (parseFloat(p.accuracy_score) || 0.0);
    }

    sumAbsError += Math.abs(parseFloat(p.actual_delta_points) || 0.0);

    const setupStr = (p.actionable_setup || '').toUpperCase();
    if (setupStr.startsWith('YES') && !isVetoed) {
      actionableTotal++;
      if (p.is_direction_hit === 1) actionableHitCount++;
    }
  });

  const latest = querySQLJSON(`SELECT * FROM typesafe_predictions ORDER BY id DESC LIMIT 1;`)[0] || null;

  return {
    totalEvaluated,
    activeForecastsTotal,
    vetoedTotal,
    directionHitCount: hitCount,
    directionHitRatePct: activeForecastsTotal > 0 ? +((hitCount / activeForecastsTotal) * 100).toFixed(1) : 0.0,
    actionableTotal,
    actionableHitCount,
    actionableHitRatePct: actionableTotal > 0 ? +((actionableHitCount / actionableTotal) * 100).toFixed(1) : 0.0,
    avgAccuracyScore: activeForecastsTotal > 0 ? +(sumAccuracy / activeForecastsTotal).toFixed(1) : 0.0,
    meanAbsoluteErrorPts: +(sumAbsError / totalEvaluated).toFixed(1),
    latestPrediction: latest
  };
}

// Auto init on import
initDatabase();
