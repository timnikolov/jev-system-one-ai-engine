/**
 * @file predictor.js
 * @description Core System One AI Predictor & Deterministic Policy Guardrail Engine ("Code Decides")
 */

import { insertPrediction, getPendingPredictions, evaluatePrediction, getAccuracyStats } from './database.js';
import { LLMEngine } from './llm_engine.js';

let lastJevStatePayload = null;

export function getLastJevInputPayload() {
  return lastJevStatePayload;
}

/**
 * Predict next candle direction, magnitude, and market regime, enforcing deterministic policy rules
 * @param {import('./types.js').TelemetryInputState} liveState Market telemetry and account state
 * @returns {Promise<{success: boolean, prediction?: Object, lastInput?: Object, accuracyStats?: Object, error?: string, reason?: string}>} Prediction result
 */
export async function runTypeSafeJevPrediction(liveState = {}) {
  try {
    // Standardized quote parameter extraction with fallback
    const currentBid = liveState.quote?.bid ?? liveState.bid ?? 0;
    if (!currentBid || currentBid === 0) {
      return { success: false, reason: 'Market bid quote unavailable' };
    }

    // Automatically evaluate pending predictions against current close price
    evaluatePendingPredictions(currentBid);

    const symbol = liveState.symbol || 'USTEC (US Tech 100 Index Futures)';
    const rsi = liveState.quote?.rsi ?? liveState.rsi ?? 50.0;
    const macd = liveState.quote?.macd ?? liveState.macd ?? 0.0;
    const atr = liveState.positionsAnalysis?.atr ?? liveState.atr ?? 43.1;
    const timeframe = 'M15';

    // Target close timestamp (Next sharp 15m candle close)
    const now = new Date();
    const currentMin = now.getMinutes();
    const next15Min = Math.ceil((currentMin + 1) / 15) * 15;
    const targetCloseDate = new Date(now);
    targetCloseDate.setMinutes(next15Min, 0, 0);
    const targetCloseTimestamp = targetCloseDate.getTime();

    // 1. Synchronized 10-Candle Multi-Series Telemetry Sequence
    const recentCloses = (Array.isArray(liveState.recentCloses) && liveState.recentCloses.length > 0)
      ? liveState.recentCloses
      : [
          +(currentBid - 40.5).toFixed(1), +(currentBid - 35.0).toFixed(1), +(currentBid - 28.5).toFixed(1),
          +(currentBid - 22.1).toFixed(1), +(currentBid - 15.5).toFixed(1), +(currentBid - 18.4).toFixed(1),
          +(currentBid - 10.5).toFixed(1), +(currentBid - 6.0).toFixed(1), +(currentBid - 2.5).toFixed(1),
          currentBid
        ];

    const candleDeltas = [];
    for (let i = 1; i < recentCloses.length; i++) {
      candleDeltas.push(+(recentCloses[i] - recentCloses[i - 1]).toFixed(1));
    }

    const rsiSeq = (Array.isArray(liveState.rsiSequence) && liveState.rsiSequence.length > 0)
      ? liveState.rsiSequence
      : [52.0, 54.5, 57.1, 60.2, 62.8, 64.0, 65.5, 66.8, 67.9, parseFloat(rsi)];

    const atrSeq = (Array.isArray(liveState.atrSequence) && liveState.atrSequence.length > 0)
      ? liveState.atrSequence
      : [42.1, 42.5, 43.0, 43.1, parseFloat(atr)];

    const wickSeq = (Array.isArray(liveState.wickSequence) && liveState.wickSequence.length > 0)
      ? liveState.wickSequence
      : ['NORMAL', 'NORMAL', 'UPPER_WICK_REJECTION'];

    // 2. Sequence Analytics: Detect RSI Divergence & Volatility Squeeze Ratios
    let rsiDivergence = 'ALIGNED_MOMENTUM';
    if (rsiSeq.length >= 3 && recentCloses.length >= 3) {
      const pLast = recentCloses[recentCloses.length - 1];
      const pPrev = recentCloses[recentCloses.length - 3];
      const rLast = rsiSeq[rsiSeq.length - 1];
      const rPrev = rsiSeq[rsiSeq.length - 3];

      if (pLast > pPrev && rLast < rPrev) rsiDivergence = 'BEARISH_RSI_DIVERGENCE';
      else if (pLast < pPrev && rLast > rPrev) rsiDivergence = 'BULLISH_RSI_DIVERGENCE';
    }

    const currentAtr = Math.max(parseFloat(atr) || 24.0, 10.0);
    const h4AtrVal = liveState.h4Atr || +(currentAtr * 3.25).toFixed(1);
    const atrExpansionRatio = +(currentAtr / Math.max(1.0, (h4AtrVal / 4.0))).toFixed(2);
    let atrExpansionStatus = 'STANDARD_VOLATILITY';
    if (atrExpansionRatio >= 1.5) atrExpansionStatus = 'HIGH_VOLATILITY_EXPANSION_BREAKOUT';
    else if (atrExpansionRatio <= 0.7) atrExpansionStatus = 'LOW_VOLATILITY_COMPRESSION_SQUEEZE';

    // Microstructure & Spread Analytics
    const rawSpread = liveState.quote?.spread ?? liveState.spread ?? 10.0;
    const spreadPts = rawSpread <= 5.0 ? +(rawSpread * 10).toFixed(1) : rawSpread;

    let spreadStatus = 'NORMAL_LIQUID_SPREAD';
    if (spreadPts >= 40.0) spreadStatus = 'EXTREME_NEWS_SPREAD_EXPANSION';
    else if (spreadPts >= 25.0) spreadStatus = 'ELEVATED_SPREAD_WIDENING';
    else if (spreadPts >= 18.0) spreadStatus = 'MODERATE_SPREAD_INCREASE';

    // Account Context & Soft Drawdown Gates
    const acc = liveState.account || {};
    const accBalance = (acc.balance && acc.balance > 0) ? acc.balance : 10000.0;
    const accEquity = (acc.equity && acc.equity > 0) ? acc.equity : 10000.0;
    const drawdownLimitPct = 5.0;
    const currentDrawdownPct = Math.max(0, +(((accBalance - accEquity) / accBalance) * 100).toFixed(2));
    let drawdownStatus = 'NORMAL_DRAWDOWN_SAFE';
    if (currentDrawdownPct >= 3.5) drawdownStatus = 'ELEVATED_DRAWDOWN_WARNING';
    else if (currentDrawdownPct >= 2.0) drawdownStatus = 'MODERATE_DRAWDOWN_MONITOR';

    const accountContext = {
      account_balance: accBalance,
      account_equity: accEquity,
      daily_drawdown_limit_pct: `${drawdownLimitPct}%`,
      current_drawdown_pct: `${currentDrawdownPct}%`,
      drawdown_status: drawdownStatus,
      gate_mode: 'SOFT_GATE_VISUAL_ONLY'
    };

    // Macro Calendar Proximity
    const macroEvents = liveState.macroEvents || [];
    let preNewsFreezeWindow = false;
    let upcomingHighImpactEvents = [];
    let newsEventWarning = 'NO_IMMINENT_HIGH_IMPACT_NEWS';

    if (Array.isArray(macroEvents) && macroEvents.length > 0) {
      preNewsFreezeWindow = true;
      upcomingHighImpactEvents = macroEvents;
      newsEventWarning = `HIGH_IMPACT_NEWS_PROXIMITY (${macroEvents.map(e => e.title || e.event).join(', ')})`;
    }

    const macroCalendarProximity = {
      upcoming_events: upcomingHighImpactEvents,
      pre_news_freeze_window: preNewsFreezeWindow,
      news_event_warning: newsEventWarning,
      soft_gate_status: 'SOFT_WARNING_VISUAL_ONLY'
    };

    // Soft Gate Warning Flags (Rendered visually to user UI)
    const softGateWarnings = [];
    if (preNewsFreezeWindow) {
      softGateWarnings.push(`NEWS: ${newsEventWarning}`);
    }
    if (spreadPts >= 35.0) {
      softGateWarnings.push(`SPREAD: ${spreadPts} pts (Extreme News Expansion)`);
    }
    if (drawdownStatus === 'ELEVATED_DRAWDOWN_WARNING') {
      softGateWarnings.push(`ACCOUNT: Drawdown Warning (${currentDrawdownPct}%)`);
    }

    // Dynamic ATR-Relative Range Bands
    const extremeScaleMin = +(currentAtr * 1.5).toFixed(0);
    const extremeScaleMax = +(currentAtr * 3.5).toFixed(0);
    const modScaleMin = +(currentAtr * 0.6).toFixed(0);
    const modScaleMax = +(currentAtr * 1.8).toFixed(0);
    const mildScaleMin = +(currentAtr * 0.2).toFixed(0);
    const mildScaleMax = +(currentAtr * 0.8).toFixed(0);
    const neutralScale = +(currentAtr * 0.5).toFixed(0);

    // 3. Construct Rich State Payload for System One Neural Reasoning
    const richStatePayload = {
      symbol,
      timeframe: 'M15',
      current_bid: currentBid,
      target_close_time: targetCloseDate.toLocaleTimeString(),
      account_context: accountContext,
      macro_calendar_proximity: macroCalendarProximity,
      atr_squeeze_ratio: atrExpansionRatio,
      soft_gates: {
        status: softGateWarnings.length > 0 ? 'SOFT_WARNING_ACTIVE' : 'ALL_SOFT_GATES_CLEAR',
        warnings: softGateWarnings
      },
      moving_averages_telemetry: liveState.movingAverages || {
        ema_21: +(currentBid - 15).toFixed(1),
        ema_50: +(currentBid - 35).toFixed(1),
        ema_55: +(currentBid - 40).toFixed(1),
        ema_89_144: +(currentBid - 70).toFixed(1),
        ema_200: +(currentBid - 120).toFixed(1),
        ema_stack_alignment: 'PERFECT_BULLISH_EMA_STACK'
      },
      telemetry_sequence_last_10_m15_candles: {
        closes: recentCloses,
        point_moves: candleDeltas,
        rsi_14_sequence: rsiSeq,
        atr_14_sequence: atrSeq,
        wick_rejection_types: wickSeq
      },
      sequence_analytics: {
        rsi_divergence_status: rsiDivergence,
        volatility_regime: atrExpansionStatus,
        atr_expansion_ratio_m15_vs_h4: atrExpansionRatio
      }
    };

    lastJevStatePayload = richStatePayload;

    let predictedScore = 3.0;
    let predictedDirection = 'NEUTRAL';
    let predictedMagnitude = 'NEUTRAL_CONSOLIDATION';
    let predictedDeltaRange = `-${neutralScale} to +${neutralScale} pts`;
    let marketRegime = 'RANGE_ACCUMULATION_ZONE_A';
    let confidence = 0.88;
    let noulActionableProb = 0.50;
    let signalQualityScore = 4.0;
    let marketToxicityProb = 0.15;
    let regimeTransitionProb = 0.20;
    let actionableSetup = 'NEUTRAL (Range/Wait)';
    let isNeuralModelInvoked = false;
    let predictionSource = 'QUANT_HEURISTIC';

    // 4. Query Multi-Provider Neural Model for 6 Parallel Judgments
    const neuralResult = await LLMEngine.askSystemOneJev(richStatePayload);
    if (neuralResult && neuralResult.score) {
      predictedScore = neuralResult.score;
      confidence = neuralResult.confidence || 0.85;
      marketRegime = neuralResult.regime || 'RANGE_ACCUMULATION_ZONE_A';
      signalQualityScore = neuralResult.signalQuality || 4.0;
      marketToxicityProb = neuralResult.isToxic || 0.15;
      regimeTransitionProb = neuralResult.isRegimeTransition || 0.20;
      noulActionableProb = neuralResult.noul || 0.50;
      isNeuralModelInvoked = true;
      predictionSource = neuralResult.source || 'NEURAL_MODEL';
    }

    // Calibrated Quantitative Heuristic Fallback (if remote/local LLM is unreachable)
    if (!isNeuralModelInvoked) {
      let scoreAcc = 3.0;
      if (rsi >= 65.0) scoreAcc += 1.2;
      else if (rsi <= 35.0) scoreAcc -= 1.2;
      if (rsiDivergence === 'BULLISH_RSI_DIVERGENCE') scoreAcc += 0.8;
      else if (rsiDivergence === 'BEARISH_RSI_DIVERGENCE') scoreAcc -= 0.8;
      predictedScore = +Math.min(5.0, Math.max(1.0, scoreAcc)).toFixed(1);
    }

    // Universal Continuous Granular Threshold & Range Mapping
    if (predictedScore >= 4.5) {
      predictedDirection = 'BULLISH_UP';
      predictedMagnitude = 'EXTREME_EXPANSION';
      predictedDeltaRange = `+${extremeScaleMin} to +${extremeScaleMax} pts`;
      marketRegime = 'STRONG_BULL_EXPANSION';
    } else if (predictedScore >= 3.6) {
      predictedDirection = 'BULLISH_UP';
      predictedMagnitude = 'MODERATE_EXPANSION';
      predictedDeltaRange = `+${modScaleMin} to +${modScaleMax} pts`;
      if (!isNeuralModelInvoked) marketRegime = 'STRONG_BULL_EXPANSION';
    } else if (predictedScore >= 3.1) {
      predictedDirection = 'MILD_BULLISH';
      predictedMagnitude = 'MILD_ACCUMULATION';
      predictedDeltaRange = `+${mildScaleMin} to +${mildScaleMax} pts`;
    } else if (predictedScore <= 1.5) {
      predictedDirection = 'BEARISH_DOWN';
      predictedMagnitude = 'EXTREME_EXPANSION';
      predictedDeltaRange = `-${extremeScaleMax} to -${extremeScaleMin} pts`;
      marketRegime = 'STRONG_BEAR_EXPANSION';
    } else if (predictedScore <= 2.5) {
      predictedDirection = 'BEARISH_DOWN';
      predictedMagnitude = 'MODERATE_EXPANSION';
      predictedDeltaRange = `-${modScaleMax} to -${modScaleMin} pts`;
      if (!isNeuralModelInvoked) marketRegime = 'STRONG_BEAR_EXPANSION';
    } else if (predictedScore <= 2.9) {
      predictedDirection = 'MILD_BEARISH';
      predictedMagnitude = 'MILD_DISTRIBUTION';
      predictedDeltaRange = `-${mildScaleMax} to -${mildScaleMin} pts`;
    } else {
      predictedDirection = 'NEUTRAL';
      predictedMagnitude = 'NEUTRAL_CONSOLIDATION';
      predictedDeltaRange = `-${neutralScale} to +${neutralScale} pts`;
    }

    // Continuous Monotonic NOUL Actionability Calculation
    const scoreDeviation = Math.abs(predictedScore - 3.0);
    noulActionableProb = +(0.45 + (scoreDeviation / 2.0) * 0.50).toFixed(2);
    const probPct = Math.round(noulActionableProb * 100);

    // 5. Deterministic Policy Engine & Hard Veto Gate ("Code Decides")
    let policyVerdict = 'APPROVED_TRADE_EXECUTION';
    let policyGateReason = 'High Confluence Setup Passed';
    let isTradeVetoed = false;

    const rangeLocationPct = liveState.rangeLocationPct ?? 50.0;
    const adrExhaustionPct = liveState.adrExhaustionPct ?? 70.0;
    const distToHtfPivot = liveState.distToHtfPivot ?? 25.0;

    if (confidence < 0.70) {
      isTradeVetoed = true;
      policyVerdict = 'VETO_LOW_CONFIDENCE_CHOP';
      policyGateReason = `Model confidence (${Math.round(confidence * 100)}%) below cutoff (70%)`;
      marketRegime = 'HIGH_VOLATILITY_CHOP';
    } else if (signalQualityScore < 3.0) {
      isTradeVetoed = true;
      policyVerdict = 'VETO_POOR_SIGNAL_QUALITY';
      policyGateReason = `Signal quality score (${signalQualityScore}/5.0) below threshold (3.0/5.0)`;
    } else if (marketToxicityProb >= 0.55) {
      isTradeVetoed = true;
      policyVerdict = 'VETO_TOXIC_ORDER_FLOW';
      policyGateReason = `Order flow toxicity (${Math.round(marketToxicityProb * 100)}%) exceeds safety cutoff (55%)`;
    } else if (predictedScore >= 3.5 && rangeLocationPct >= 96.0 && signalQualityScore < 4.5) {
      isTradeVetoed = true;
      policyVerdict = 'VETO_RANGE_CEILING_WALL';
      policyGateReason = `Price at 4H Range Ceiling (${rangeLocationPct}%) without extreme confluence`;
    } else if (predictedScore >= 3.5 && adrExhaustionPct >= 130.0) {
      isTradeVetoed = true;
      policyVerdict = 'VETO_ADR_EXHAUSTION_OVERSTRETCH';
      policyGateReason = `Intraday range (${adrExhaustionPct}%) overstretched`;
    }

    if (isTradeVetoed) {
      actionableSetup = `NO - ${policyVerdict} (${probPct}% Conviction | ${policyGateReason})`;
    } else if (predictedScore >= 3.1) {
      actionableSetup = `YES - Bullish Setup (${probPct}% Conviction | Quality ${signalQualityScore}/5.0)`;
    } else if (predictedScore <= 2.9) {
      actionableSetup = `YES - Bearish Setup (${probPct}% Conviction | Quality ${signalQualityScore}/5.0)`;
    } else {
      actionableSetup = `NEUTRAL - Range/Wait (${probPct}% Conviction)`;
    }

    const predictionPayload = {
      timestamp: new Date().toISOString(),
      timeframe,
      predictedScore,
      predictedDirection,
      predictedMagnitude,
      predictedDeltaRange,
      marketRegime,
      confidence,
      signalQualityScore,
      marketToxicityProb,
      regimeTransitionProb,
      policyVerdict,
      policyGateReason,
      isTradeVetoed,
      actionableSetup,
      softGateWarnings: softGateWarnings.join(' | ') || 'NONE',
      predictionSource,
      historicalSnapshot: JSON.stringify(recentCloses),
      startPrice: currentBid,
      targetCloseTimestamp,
      inputPayload: JSON.stringify(richStatePayload)
    };

    insertPrediction(predictionPayload);
    console.log(`🤖 [System One Predictor] Score ${predictedScore}/5.0 (${predictedDirection}) | Verdict: ${policyVerdict}`);

    return {
      success: true,
      prediction: predictionPayload,
      lastInput: richStatePayload,
      accuracyStats: getAccuracyStats()
    };
  } catch (err) {
    console.error('Error in runTypeSafeJevPrediction:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Evaluate pending predictions against actual market close price
 * @param {number} currentBid Actual candle close price
 */
export function evaluatePendingPredictions(currentBid) {
  try {
    const pending = getPendingPredictions();
    if (!pending || pending.length === 0) return;

    for (const pred of pending) {
      const startPrice = parseFloat(pred.start_price) || currentBid;
      const actualDeltaPts = +(currentBid - startPrice).toFixed(2);
      const score = parseFloat(pred.predicted_score) || 3.0;

      let isDirectionHit = false;
      let accuracyScore = 0.0;
      let actualDirection = 'NEUTRAL';

      if (actualDeltaPts >= 3.0) actualDirection = 'BULLISH_UP';
      else if (actualDeltaPts <= -3.0) actualDirection = 'BEARISH_DOWN';

      if (score > 3.0 && actualDeltaPts >= 1.5) {
        isDirectionHit = true;
        accuracyScore = 100.0;
      } else if (score < 3.0 && actualDeltaPts <= -1.5) {
        isDirectionHit = true;
        accuracyScore = 100.0;
      } else if (score === 3.0 && Math.abs(actualDeltaPts) <= 15.0) {
        isDirectionHit = true;
        accuracyScore = 100.0;
      }

      evaluatePrediction(pred.id, currentBid, actualDirection, actualDeltaPts, isDirectionHit, accuracyScore);
    }
  } catch (e) {
    console.error('Error in evaluatePendingPredictions:', e.message);
  }
}
