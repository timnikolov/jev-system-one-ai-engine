# 🏗️ Technical Architecture & AI System Specification

**TypeSafe Jev System One AI Engine** — Multi-Provider 6-Judgment Predictive Engine & Deterministic Policy Guardrail System for High-Frequency Quantitative Trading.

---

## 1. Executive Summary & Design Philosophy

Traditional machine learning implementations in quantitative trading often fail due to **probabilistic non-stationarity** and **LLM hallucination risk**. When an autonomous AI system makes unconstrained trading decisions directly from unstructured prompts, it suffers from catastrophic risk exposure during volatile or black-swan market regimes.

To solve this, the **TypeSafe Jev System One AI Engine** enforces a **Hybrid Dual-Engine Pattern**:

```
                                  +---------------------------------------+
                                  |     LIVE MARKET TELEMETRY INGESTION   |
                                  |  - 10-Candle M15 Delta Sequences      |
                                  |  - Multi-TF RSI & ATR Analytics       |
                                  |  - Volume Profile (POC / VAH / VAL)   |
                                  |  - Account Equity & Drawdown Context  |
                                  +-------------------+-------------------+
                                                      |
                                                      v
                                  +---------------------------------------+
                                  |  NEURAL SYSTEM ONE JUDGMENT LAYER     |
                                  |  (Gemini / Qwen 3.8 / TypeSafe Cloud) |
                                  |                                       |
                                  |  Evaluates 6 Parallel Judgments:      |
                                  |  1. Candle Directional Score (1.0-5.0)|
                                  |  2. Neural Model Confidence (50-95%)  |
                                  |  3. Market Regime Classification      |
                                  |  4. Signal Quality Confluence (1.0-5) |
                                  |  5. Order Flow Toxicity Prob (0-1.0)  |
                                  |  6. Regime Changepoint Prob (0-1.0)   |
                                  +-------------------+-------------------+
                                                      |
                                                      v
                                  +---------------------------------------+
                                  |  DETERMINISTIC POLICY GUARDRAILS      |
                                  |         ("Code Decides Layer")        |
                                  +-------------------+-------------------+
                                                     / \
                                                    /   \
                                       Hard Vetoes /     \ Visual Soft Warnings
                                                  /       \
                                                 v         v
                     +----------------------------------+  +----------------------------------+
                     |  EXECUTION BLOCKED               |  |  NON-BLOCKING USER ALERTS        |
                     |  - Low Confidence (< 70%)        |  |  - News Release Proximity Window |
                     |  - Toxic Order Flow (>= 55%)     |  |  - Account Drawdown Warning Cards|
                     |  - Range Ceiling Wall Resistance |  |  - Spread Expansion Widening     |
                     +----------------------------------+  +----------------------------------+
                                                 \         /
                                                  \       /
                                                   v     v
                                  +---------------------------------------+
                                  |  CLOSED-LOOP EVALUATION & DATABASE    |
                                  |  - Embedded SQLite Telemetry Log      |
                                  |  - Target Close Price Evaluation      |
                                  |  - Direction Hit Rate % & MAE Stats   |
                                  +---------------------------------------+
```

---

## 2. End-to-End Sequence Diagram (Mermaid)

```mermaid
sequenceDiagram
    autonumber
    participant Client as REST Client / HFT Daemon
    participant Predictor as System One Predictor (predictor.js)
    participant LLM as Multi-Provider LLM Engine (llm_engine.js)
    participant Policy as Deterministic Policy Engine ("Code Decides")
    participant DB as SQLite Telemetry Database (database.js)

    Client->>Predictor: POST /api/v1/predict (TelemetryInputState JSON)
    Note over Predictor: 1. Parse 10-Candle Deltas, RSI Divergence & Spread Status
    Predictor->>Predictor: Build Rich State Payload JSON
    Predictor->>LLM: askSystemOneJev(statePayload)
    
    alt Remote / Local Neural Model Available
        LLM-->>Predictor: Returns 6 Neural Judgments JSON
    else Connection Timeout / Unavailable
        LLM-->>Predictor: Fallback to Calibrated Quantitative Predictor
    end

    Note over Predictor: 2. Map Granular Thresholds & ATR Delta Ranges
    Predictor->>Policy: Evaluate Guardrail Matrix (Confidence, Toxicity, Range Wall, ADR)
    
    alt Hard Veto Condition Triggered (e.g. Confidence < 70%)
        Policy-->>Predictor: Returns isTradeVetoed = true + VETO_REASON
    else Confluence Passed
        Policy-->>Predictor: Returns isTradeVetoed = false + APPROVED_TRADE_EXECUTION
    end

    Predictor->>DB: insertPrediction(predictionPayload)
    Predictor-->>Client: Returns 200 OK (PredictionResult Payload)
    
    Note over DB: 3. Target Candle Period Closes
    Client->>Predictor: POST /api/v1/evaluate (actualClosePrice)
    Predictor->>DB: evaluatePrediction(id, actualClosePrice)
    Note over DB: Computes Direction Hit Rate % & Mean Absolute Error (MAE)
```

---

## 3. 6 Parallel Neural Judgments Specification

Instead of requesting an unstructured text summary or a single binary trade decision, System One queries the LLM for **6 parallel structured judgments**:

| Judgment Symbol | Data Type | Scale / Enum | Product Definition & Purpose |
|---|---|---|---|
| `candle_score` | Continuous Score | `1.0` - `5.0` | Directional conviction for the next M15 candle (`1.0` = Extreme Bear, `3.0` = Neutral, `5.0` = Extreme Bull). |
| `confidence` | Probability | `0.50` - `0.95` | Model's statistical certainty in its technical assessment. |
| `regime` | Categorical | `STRONG_BULL_EXPANSION` \| `STRONG_BEAR_EXPANSION` \| `RANGE_ACCUMULATION_ZONE_A` \| `HIGH_VOLATILITY_CHOP` | Active macro/micro market environment classification. |
| `signal_quality` | Rating Score | `1.0` - `5.0` | Technical confluence rating evaluating structural alignment across indicators. |
| `is_market_toxic` | Probability | `0.0` - `1.0` | Probability of order book toxicity, erratic chop, or institutional manipulative sweeps. |
| `is_regime_transitioning` | Probability | `0.0` - `1.0` | Probability of structural regime changepoint (breakout vs fakeout transition). |

---

## 4. Deterministic Safety Matrix: Hard Vetoes vs Visual Soft Warnings

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

## 5. Standardized Telemetry Schema & Payload Specification

### Canonical Input Telemetry Schema (`TelemetryInputState`)
```json
{
  "symbol": "USTEC",
  "quote": {
    "bid": 19850.50,
    "ask": 19851.50,
    "spread": 10.0,
    "rsi": 68.4,
    "macd": 12.5
  },
  "positionsAnalysis": {
    "atr": 42.5
  },
  "recentCloses": [19810, 19815.5, 19822, 19828.4, 19835, 19832.1, 19840, 19844.5, 19848, 19850.5],
  "rsiSequence": [52.0, 54.5, 57.1, 60.2, 62.8, 64.0, 65.5, 66.8, 67.9, 68.4],
  "account": {
    "balance": 25000.0,
    "equity": 24850.0
  },
  "macroEvents": [
    { "title": "US Core CPI YoY", "time": "14:30", "impact": "HIGH" }
  ]
}
```

### Canonical Output Prediction Payload (`PredictionResultPayload`)
```json
{
  "timestamp": "2026-09-20T21:30:00.000Z",
  "timeframe": "M15",
  "predictedScore": 4.2,
  "predictedDirection": "BULLISH_UP",
  "predictedMagnitude": "MODERATE_EXPANSION",
  "predictedDeltaRange": "+26 to +77 pts",
  "marketRegime": "STRONG_BULL_EXPANSION",
  "confidence": 0.88,
  "signalQualityScore": 4.0,
  "marketToxicityProb": 0.15,
  "regimeTransitionProb": 0.20,
  "policyVerdict": "APPROVED_TRADE_EXECUTION",
  "policyGateReason": "High Confluence Setup Passed",
  "isTradeVetoed": false,
  "actionableSetup": "YES - Bullish Setup (75% Conviction | Quality 4.0/5.0)",
  "softGateWarnings": "NEWS: HIGH_IMPACT_NEWS_PROXIMITY (US Core CPI YoY)",
  "predictionSource": "LOCAL_LLM_QWEN",
  "startPrice": 19850.5,
  "targetCloseTimestamp": 1789932600000
}
```

---

## 6. Quantitative Evaluation & Accuracy Tracking

Every prediction target is linked to a future target candle close timestamp. Upon period completion, the engine automatically calculates:
1. **Direction Hit Rate %**: Percentage of evaluated candles where predicted direction matched actual price delta direction.
2. **Mean Absolute Error (MAE)**: Average point deviation between start price and actual close price vs predicted delta range.
3. **Actionable Setup Win Rate %**: Accuracy rate specifically for setups approved by the Deterministic Policy Engine.

