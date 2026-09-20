# 🧠 TypeSafe Jev System One AI Engine
> **Multi-Provider 6-Judgment Predictive Engine & Deterministic Guardrail Policy System for Quantitative Financial Trading**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![AI PM Portfolio](https://img.shields.io/badge/Portfolio-AI%20Product%20Manager-purple.svg)](https://github.com/timnikolov)
[![GitHub Profile](https://img.shields.io/badge/GitHub-timnikolov-181717.svg?logo=github)](https://github.com/timnikolov)

---

## 📌 Executive Overview

The **TypeSafe Jev System One AI Engine** is an enterprise-grade AI decision engine designed for high-frequency financial market prediction (US Tech 100 / USTEC Index Futures). 

In live algorithmic trading, relying solely on unstructured LLM outputs introduces critical risks: **hallucinations, non-deterministic outputs, and lack of risk control**. This project demonstrates a production-grade **Hybrid AI Architecture**: combining high-velocity neural reasoning (**System One LLM**) with deterministic safety guardrails (**Code Decides Policy Engine**).

### 🎯 Key Product Innovations
1. **6 Parallel Neural Judgments Pattern**: Instead of asking an LLM for a binary trade signal, the engine queries the model for 6 structured mathematical judgments (Directional Score, Confidence, Regime Classification, Signal Quality, Order Flow Toxicity, and Regime Transition Probability).
2. **"Code Decides" Deterministic Policy Engine**: System One outputs scores, but deterministic JavaScript policy code enforces hard vetoes (blocking execution during low confidence, high order flow toxicity, or range resistance walls).
3. **Soft vs Hard Veto Gate Layer**: Differentiates between non-negotiable execution blocks (hard vetoes) and visual risk alerts (soft warnings for macro economic news proximity and account drawdown).
4. **Ground-Truth Multi-Horizon Telemetry**: Ingests 10-candle M15 sequences, multi-timeframe RSI/ATR analytics, Volume Profile (POC/VAH/VAL) boundaries, and moving average stack alignments.
5. **Closed-Loop Quantitative Accuracy Evaluator**: Automatically logs predictions to an embedded SQLite database and evaluates direction hit rates and Mean Absolute Error (MAE) against actual market close prices.

---

## 📐 System Pipeline Architecture

```mermaid
flowchart TD
    subgraph Layer1 [1. Telemetry Ingestion]
        A["Market Quotes, 10-Candle M15 Deltas & Multi-TF Technicals"]
    end

    subgraph Layer2 [2. Neural System One Reasoning]
        B["LLM Query (6 Parallel Judgments)"]
    end

    subgraph Layer3 [3. Deterministic Guardrails ("Code Decides")]
        C{"Policy Engine Matrix"}
        D["Hard Veto (Blocked)"]
        E["Soft Warnings (Visual Alert)"]
        F["Approved Trade Signal"]
    end

    subgraph Layer4 [4. Closed-Loop Telemetry]
        G[("SQLite DB & Accuracy Evaluator")]
    end

    Layer1 --> Layer2
    Layer2 --> C
    C -->|Low Confidence / Toxicity| D
    C -->|Macro News Proximity| E
    C -->|High Confluence| F
    D --> Layer4
    E --> Layer4
    F --> Layer4
```

### Pipeline Overview
- **Layer 1 (Telemetry Ingestion)**: Aggregates real-time bid quotes, 10-candle M15 delta sequences, RSI divergence, ATR squeeze ratios, and account drawdown context into a rich state payload.
- **Layer 2 (Neural System One)**: Multi-provider neural engine (Gemini / Local Qwen 3.8 27B / TypeSafe Cloud) evaluates 6 parallel mathematical judgments.
- **Layer 3 (Deterministic Guardrails)**: Safety policy rules enforce non-negotiable **Hard Vetoes** (blocking trades on low confidence or order flow toxicity) while rendering **Soft Warnings** visually for macro news releases.
- **Layer 4 (Closed-Loop Telemetry)**: Logs predictions to an embedded SQLite database and evaluates direction hit rate % and Mean Absolute Error (MAE) against target candle close prices.

---

## 📋 6 Parallel Neural Judgments Specification

| Judgment Field | Type | Scale / Enum | Product Definition |
|---|---|---|---|
| `candle_score` | Float | `1.0` to `5.0` | Directional conviction (`1.0` = Extreme Bear, `3.0` = Neutral, `5.0` = Extreme Bull). |
| `confidence` | Float | `0.50` to `0.95` | Neural model conviction in technical setup. |
| `regime` | Enum | `STRONG_BULL_EXPANSION` \| `STRONG_BEAR_EXPANSION` \| `RANGE_ACCUMULATION_ZONE_A` \| `HIGH_VOLATILITY_CHOP` | Market regime classification. |
| `signal_quality` | Float | `1.0` to `5.0` | Technical confluence rating across timeframes. |
| `is_market_toxic` | Float | `0.0` to `1.0` | Probability of toxic order flow / manipulative wick sweeps. |
| `is_regime_transitioning` | Float | `0.0` to `1.0` | Probability of structural regime changepoint transition. |

---

## ⚡ Quickstart & Installation

### Prerequisites
- **Node.js**: `v18.0.0` or higher
- **SQLite3**: Pre-installed on macOS / Linux (`sqlite3` CLI)

### 1. Clone Repository & Install Dependencies
```bash
git clone https://github.com/timnikolov/jev-system-one-ai-engine.git
cd jev-system-one-ai-engine
npm install
```

### 2. Configure Environment (Optional)
Copy `config.example.json` to `config.json` to supply your API keys:
```bash
cp config.example.json config.json
```
*Note: If no API key or local LLM endpoint is available, the engine automatically uses its built-in calibrated quantitative fallback predictor.*

---

## 🚀 Runnable Demos

### Run Standalone System One Prediction Demo
```bash
npm run demo
```
*Outputs complete 6-judgment neural inference, state snapshot, soft warnings, and policy verdict.*

### Test Deterministic Policy Guardrails Suite
```bash
npm run test:policy
```
*Demonstrates hard veto triggers (low confidence, ADR exhaustion overstretch) vs visual soft gate warnings (CPI news freeze, drawdown alert).*

### Start REST API Server
```bash
npm start
```
Starts Express server on `http://localhost:3000`.

---

## 📡 REST API Reference & Schemas

### `POST /api/v1/predict`
Executes System One prediction and policy evaluation against provided market state telemetry.

**Request Payload Example (`TelemetryInputState`):**
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

**Response Payload Example (`PredictionResultPayload`):**
```json
{
  "success": true,
  "prediction": {
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
  },
  "accuracyStats": {
    "totalEvaluated": 124,
    "directionHitRatePct": 74.2,
    "meanAbsoluteErrorPts": 14.8
  }
}
```

### `GET /api/v1/accuracy`
Retrieves quantitative hit rate % and Mean Absolute Error (MAE) statistics from SQLite DB.

---

## 📑 Project Structure

```
jev-system-one-ai-engine/
├── docs/
│   └── ARCHITECTURE.md          # Technical Architecture & System Specification
├── examples/
│   ├── run_prediction.js        # Executable System One Demo Script
│   └── test_policy_engine.js    # Policy Veto & Soft Warnings Test Suite
├── src/
│   ├── database.js              # SQLite Telemetry Persistence & Evaluator
│   ├── index.js                 # Express REST API Server
│   ├── llm_engine.js            # Multi-Provider Routing (Gemini/OpenAI/Qwen/Cloud)
│   ├── predictor.js            # System One AI Predictor & Deterministic Policy Engine
│   └── types.js                 # JSDoc Schema & Type Definitions
├── .gitignore                   # Git Ignore Specification
├── config.example.json          # Sanitized Configuration Template
├── package.json                 # ES Module Package Spec
└── README.md                    # Executive AI PM Portfolio Documentation (@timnikolov)
```

---

## 🛠️ AI Product Manager (AI PM) Portfolio Context

**Author**: Tim Nikolov ([@timnikolov](https://github.com/timnikolov))  
**Domain**: Quantitative Trading Systems, Generative AI Systems, Deterministic Safety Guardrails  
**Product Strategy Highlights**:
- **Risk Mitigation**: Replaced open-ended prompt generation with structured JSON schema constraints to eliminate hallucinated parameters.
- **Safety First**: Decoupled LLM reasoning from trade execution. Neural judgments inform, but deterministic code policies decide.
- **Measurable Impact**: Embedded closed-loop quantitative evaluation directly in the DB schema to track model performance against ground-truth market outcomes.

---

## 📄 License

This repository is licensed under the [MIT License](LICENSE).
