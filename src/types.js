/**
 * @file types.js
 * @description JSDoc Type Definitions and Schema Declarations for System One AI Engine
 */

/**
 * @typedef {Object} CandleSequenceTelemetry
 * @property {number[]} closes - Last 10 M15 candle close prices
 * @property {number[]} point_moves - Point deltas between consecutive M15 closes
 * @property {number[]} rsi_14_sequence - 14-period RSI sequence across 10 candles
 * @property {number[]} atr_14_sequence - 14-period ATR sequence across 10 candles
 * @property {string[]} wick_rejection_types - Rejection candle classification (UPPER_WICK_REJECTION | LOWER_WICK_REJECTION | NORMAL)
 */

/**
 * @typedef {Object} MovingAveragesTelemetry
 * @property {number} ema_21 - 21 Exponential Moving Average
 * @property {number} ema_50 - 50 Exponential Moving Average
 * @property {number} ema_55 - 55 Exponential Moving Average
 * @property {number} ema_89_144 - 89/144 Institutional EMA
 * @property {number} ema_200 - 200 EMA Benchmark
 * @property {string} dist_to_21_ema_pts - Distance from bid to 21 EMA in points
 * @property {string} dist_to_55_ema_pts - Distance from bid to 55 EMA in points
 * @property {string} dist_to_89_ema_pts - Distance from bid to 89 EMA in points
 * @property {string} dist_to_200_ema_pts - Distance from bid to 200 EMA in points
 * @property {string} ema_stack_alignment - Structural classification (PERFECT_BULLISH_EMA_STACK | PERFECT_BEARISH_EMA_STACK | CONSOLIDATION_CHOP_CROSSOVER)
 */

/**
 * @typedef {Object} AccountContextTelemetry
 * @property {number} account_balance - Actual MT5 Account Balance (€)
 * @property {number} account_equity - Actual MT5 Account Equity (€)
 * @property {number} margin_used - Open Margin Used (€)
 * @property {number} open_equity_pnl - Floating Open PnL (€)
 * @property {string} daily_drawdown_limit_pct - Policy Drawdown Limit (e.g. "5.0%")
 * @property {string} current_drawdown_pct - Active Peak-to-Trough Drawdown %
 * @property {string} drawdown_status - Account Health (NORMAL_DRAWDOWN_SAFE | ELEVATED_DRAWDOWN_WARNING)
 * @property {string} gate_mode - Soft Gate Classification (SOFT_GATE_VISUAL_ONLY)
 */

/**
 * @typedef {Object} MacroCalendarProximity
 * @property {Array<{title: string, time: string, impact: string}>} upcoming_events - Imminent economic news events
 * @property {boolean} pre_news_freeze_window - True if high impact news is scheduled within 30 minutes
 * @property {string} news_event_warning - Human readable warning title
 * @property {string} soft_gate_status - Soft Warning Classification (SOFT_WARNING_VISUAL_ONLY)
 */

/**
 * @typedef {Object} SystemOneStatePayload
 * @property {string} symbol - Trading instrument (e.g. USTEC / US Tech 100 Index Futures)
 * @property {string} timeframe - Prediction timeframe (M15)
 * @property {number} current_bid - Real-time market bid quote
 * @property {AccountContextTelemetry} account_context - MT5 Live Account Context
 * @property {MacroCalendarProximity} macro_calendar_proximity - Economic Calendar Proximity
 * @property {CandleSequenceTelemetry} telemetry_sequence_last_10_m15_candles - 10-Candle Ground-Truth Telemetry
 * @property {MovingAveragesTelemetry} moving_averages_telemetry - EMA Stack & Distance Analytics
 */

/**
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
 * @typedef {Object} PolicyVerdictResult
 * @property {string} policyVerdict - Verdict Code (e.g. APPROVED_TRADE_EXECUTION | VETO_LOW_CONFIDENCE_CHOP | VETO_TOXIC_ORDER_FLOW | VETO_RANGE_CEILING_WALL)
 * @property {string} policyGateReason - Detailed Human-Readable Explanation
 * @property {boolean} isTradeVetoed - Hard Policy Execution Gate Veto (true/false)
 * @property {string[]} softGateWarnings - List of visual warnings displayed to the user
 */

export {};
