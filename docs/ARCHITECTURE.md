# Technical Architecture & AI System Specification

**TypeSafe Jev System One AI Engine** — Multi-Provider 6-Judgment Predictive Engine & Deterministic Policy Guardrail System for High-Frequency Quantitative Trading.

---

## 1. Executive Summary & Design Philosophy

Traditional machine learning implementations in quantitative trading often fail due to **probabilistic non-stationarity** and **LLM hallucination risk**. When an autonomous AI system makes unconstrained trading decisions directly from unstructured prompts, it suffers from catastrophic risk exposure during black-swan market regimes.

To solve this, the **TypeSafe Jev System One AI Engine** enforces a **Hybrid Dual-Engine Pattern**:

```
+-----------------------------------------------------------------------------------+
|                              INPUT TELEMETRY LAYER                                |
|  (10-Candle M15 Delta Sequences, Multi-TF RSI/ATR, Volume Profile, Account Context)|
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                        NEURAL SYSTEM ONE JUDGMENT LAYER                           |
|       (6 Parallel Neural Judgments via Gemini / Local Qwen 3.8 27B / TypeSafe)    |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                    DETERMINISTIC POLICY ENGINE ("Code Decides")                   |
|     (Hard Veto Matrix: Low Confidence, Toxicity, Overstretch, Range Ceiling)       |
|     (Soft Gate Layer: Visual News Proximity & Account Drawdown Warning Cards)     |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                            EVALUATED OUTPUT & TELEMETRY                           |
|   (SQLite Persistence, Direction Hit Rate %, Mean Absolute Error [MAE] Analytics) |
+-----------------------------------------------------------------------------------+
```

---

## 2. 6 Parallel Neural Judgments Design Pattern

Instead of requesting an unstructured text summary or a single binary trade decision, System One queries the LLM for **6 parallel structured judgments**:

| Judgment Symbol | Data Type | Range / Options | Product Definition & Purpose |
|---|---|---|---|
| `candle_score` | Continuous Score | `1.0` - `5.0` | Directional conviction for the next M15 candle (`1.0` = Extreme Bear, `3.0` = Neutral, `5.0` = Extreme Bull). |
| `confidence` | Probability | `0.50` - `0.95` | Model's statistical certainty in its technical assessment. |
| `regime` | Categorical | `STRONG_BULL_EXPANSION` \| `STRONG_BEAR_EXPANSION` \| `RANGE_ACCUMULATION_ZONE_A` \| `HIGH_VOLATILITY_CHOP` | Active macro/micro market environment classification. |
| `signal_quality` | Rating Score | `1.0` - `5.0` | Technical confluence rating evaluating structural alignment across indicators. |
| `is_market_toxic` | Probability | `0.0` - `1.0` | Probability of order book toxicity, erratic chop, or institutional manipulative sweeps. |
| `is_regime_transitioning` | Probability | `0.0` - `1.0` | Probability of structural regime changepoint (breakout vs fakeout transition). |

---

## 3. Deterministic Safety Matrix: Hard Vetoes vs Visual Soft Warnings

To guarantee capital protection, **"Code Decides"**. The LLM provides scores and probabilities, but a deterministic policy layer evaluates hard veto rules:

### Hard Veto Matrix (Execution Blocked)
1. **Low Confidence Cutoff**: If `confidence < 0.70`, verdict set to `VETO_LOW_CONFIDENCE_CHOP`.
2. **Poor Signal Quality**: If `signal_quality < 3.0/5.0`, verdict set to `VETO_POOR_SIGNAL_QUALITY`.
3. **Toxic Order Flow**: If `is_market_toxic >= 0.55`, verdict set to `VETO_TOXIC_ORDER_FLOW`.
4. **Volume Profile Range Wall Resistance**: If `predictedScore >= 3.5` but price is at 4H Range Ceiling (`rangeLocationPct >= 96%`) without extreme confluence (`signal_quality < 4.5`), verdict set to `VETO_RANGE_CEILING_WALL`.
5. **Intraday Range Exhaustion**: If `predictedScore >= 3.5` and `adrExhaustionPct >= 130%`, verdict set to `VETO_ADR_EXHAUSTION_OVERSTRETCH`.

### Visual Soft Warnings (Non-Blocking)
1. **Economic News Proximity**: Imminent high-impact news releases (CPI, NFP, FOMC) render visual warning cards in the user UI (`pre_news_freeze_window: true`), allowing the user to observe market reaction without hard-blocking valid technical setups.
2. **Account Drawdown Warning**: Drawdown warning thresholds (`current_drawdown_pct >= 3.5%`) are displayed visually to highlight open risk.

---

## 4. Ground-Truth Telemetry Parsing

To eliminate hallucination, input telemetry is passed in a rich, type-safe JSON schema:
- **10-Candle Synchronized Sequences**: Close prices, point deltas, 14-period RSI sequence, 14-period ATR sequence, and candle wick rejection classifications.
- **Moving Average Stack Analytics**: Distance in points from current bid to 21, 50, 55, 89/144, and 200 EMAs + stack alignment classification (`PERFECT_BULLISH_EMA_STACK`).
- **Multi-Timeframe Structure**: Synchronized RSI, ATR, and Volume Profile (POC, VAH, VAL) across M15, H1, H4, and D1 timeframes.

---

## 5. Quantitative Evaluation & Accuracy Tracking

Every prediction target is linked to a future target candle close timestamp. Upon period completion, the engine automatically calculates:
1. **Direction Hit Rate %**: Percentage of evaluated candles where predicted direction matched actual price delta direction.
2. **Mean Absolute Error (MAE)**: Average point deviation between start price and actual close price vs predicted delta range.
3. **Actionable Setup Win Rate %**: Accuracy rate specifically for setups approved by the Deterministic Policy Engine.

