/**
 * @file types.js
 * @description JSDoc Type Definitions and Schema Declarations for System One AI Engine
 */

/**
 * Canonical Input Telemetry Payload provided to System One AI Engine
 * @typedef {Object} TelemetryInputState
 * @property {string} [symbol="USTEC"] - Trading instrument (e.g., USTEC / US Tech 100 Index Futures)
 * @property {Object} quote - Real-time market quote telemetry
 * @property {number} quote.bid - Real-time market bid quote
 * @property {number} [quote.ask] - Real-time market ask quote
 * @property {number} [quote.spread=10.0] - Raw bid/ask spread in points (10 pts = 1.0 index pt)
 * @property {number} [quote.rsi=50.0] - Active 14-period RSI reading
 * @property {number} [quote.macd=0.0] - Active MACD histogram reading
 * @property {Object} [positionsAnalysis] - Live positions & risk telemetry
 * @property {number} [positionsAnalysis.atr=43.1] - Active 14-period M15 Average True Range in points
 * @property {number[]} [recentCloses] - Last 10 M15 candle close prices for sequence analytics
 * @property {number[]} [rsiSequence] - Last 10 M15 RSI readings
 * @property {number[]} [atrSequence] - Last 5 M15 ATR readings
 * @property {string[]} [wickSequence] - Candle wick rejection types ('NORMAL' | 'UPPER_WICK_REJECTION' | 'LOWER_WICK_REJECTION')
 * @property {Object} [account] - Brokerage Live Account Context
 * @property {number} [account.balance=10000.0] - Account balance (€)
 * @property {number} [account.equity=10000.0] - Account equity (€)
 * @property {number} [account.margin=0.0] - Margin used (€)
 * @property {Array<{title: string, time: string, impact: string}>} [macroEvents] - Imminent economic news events
 * @property {Object} [movingAverages] - Scraped or computed EMA levels
 * @property {number} [movingAverages.ema_21] - 21 Exponential Moving Average
 * @property {number} [movingAverages.ema_50] - 50 Exponential Moving Average
 * @property {number} [movingAverages.ema_55] - 55 Exponential Moving Average
 * @property {number} [movingAverages.ema_89_144] - 89/144 Institutional EMA
 * @property {number} [movingAverages.ema_200] - 200 EMA Benchmark
 * @property {string} [movingAverages.ema_stack_alignment] - Stack classification ('PERFECT_BULLISH_EMA_STACK' | 'PERFECT_BEARISH_EMA_STACK' | 'CONSOLIDATION_CHOP_CROSSOVER')
 * @property {number} [rangeLocationPct=50.0] - Relative price position within 4H Volume Profile range (0% = VAL Floor, 100% = VAH Ceiling)
 * @property {number} [adrExhaustionPct=70.0] - Intraday range vs daily ATR exhaustion %
 * @property {number} [distToHtfPivot=25.0] - Distance in points to HTF Volume Accumulation Pivot
 */

/**
 * 6 Parallel Neural Judgments requested from the LLM model
 * @typedef {Object} NeuralJudgmentsOutput
 * @property {number} candle_score - Directional Conviction Score (1.0 = Extreme Bear, 3.0 = Neutral, 5.0 = Extreme Bull)
 * @property {number} confidence - Neural Model Confidence (0.50 to 0.95)
 * @property {"STRONG_BULL_EXPANSION" | "STRONG_BEAR_EXPANSION" | "RANGE_ACCUMULATION_ZONE_A" | "HIGH_VOLATILITY_CHOP"} regime - Classified Market Regime
 * @property {number} signal_quality - Technical Confluence Rating (1.0 to 5.0)
 * @property {number} is_market_toxic - Probability of Toxic Order Flow / Erratic Chop (0.0 to 1.0)
 * @property {number} is_regime_transitioning - Probability of Structural Changepoint (0.0 to 1.0)
 * @property {number} noul_conviction - Continuous Monotonic Trade Actionability (0.10 to 0.95)
 */

/**
 * Deterministic Policy Engine Decision Result ("Code Decides")
 * @typedef {Object} PolicyVerdictResult
 * @property {string} policyVerdict - Policy Verdict Code (APPROVED_TRADE_EXECUTION | VETO_LOW_CONFIDENCE_CHOP | VETO_POOR_SIGNAL_QUALITY | VETO_TOXIC_ORDER_FLOW | VETO_RANGE_CEILING_WALL | VETO_ADR_EXHAUSTION_OVERSTRETCH)
 * @property {string} policyGateReason - Detailed Human-Readable Explanation
 * @property {boolean} isTradeVetoed - Hard Policy Execution Gate Veto (true = blocked, false = approved)
 * @property {string[]} softGateWarnings - List of visual warning messages displayed to the user
 */

/**
 * Evaluated Prediction Output Payload stored in SQLite & returned to client
 * @typedef {Object} PredictionResultPayload
 * @property {string} timestamp - ISO timestamp of prediction generation
 * @property {string} timeframe - Prediction candle period ('M15')
 * @property {number} predictedScore - Directional Conviction Score (1.0 to 5.0)
 * @property {string} predictedDirection - Classified Direction ('BULLISH_UP' | 'MILD_BULLISH' | 'NEUTRAL' | 'MILD_BEARISH' | 'BEARISH_DOWN')
 * @property {string} predictedMagnitude - Expected Delta Magnitude ('EXTREME_EXPANSION' | 'MODERATE_EXPANSION' | 'MILD_ACCUMULATION' | 'NEUTRAL_CONSOLIDATION')
 * @property {string} predictedDeltaRange - Predicted point range (e.g. "+26 to +77 pts")
 * @property {string} marketRegime - Active Market Regime
 * @property {number} confidence - Model Confidence (0.50 to 0.95)
 * @property {number} signalQualityScore - Technical Confluence Score (1.0 to 5.0)
 * @property {number} marketToxicityProb - Order Flow Toxicity Probability (0.0 to 1.0)
 * @property {number} regimeTransitionProb - Structural Changepoint Probability (0.0 to 1.0)
 * @property {string} policyVerdict - Verdict code from Policy Engine
 * @property {string} policyGateReason - Policy explanation reason
 * @property {boolean} isTradeVetoed - True if trade was hard vetoed
 * @property {string} actionableSetup - User-facing actionable summary string
 * @property {string} softGateWarnings - Pipe-separated visual warning string
 * @property {string} predictionSource - Model provider ('TYPESAFE_CLOUD_JEV' | 'LOCAL_LLM_QWEN' | 'GEMINI_VISION_API' | 'QUANT_HEURISTIC')
 * @property {string} historicalSnapshot - JSON array of recent M15 closes
 * @property {number} startPrice - Baseline entry bid price
 * @property {number} targetCloseTimestamp - Unix timestamp of target M15 candle close
 * @property {string} inputPayload - Full rich state payload JSON string passed to LLM
 */

export {};
