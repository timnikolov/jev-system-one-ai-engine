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

## 📐 System Architecture

```
                                  +------------------------------+
                                  | Live Market Telemetry & HFT  |
                                  |   Sequence Ingestion (M15)   |
                                  +--------------+---------------+
                                                 |
                                                 v
                                  +------------------------------+
                                  |   System One AI Engine       |
                                  | (Gemini / Qwen 3.8 / Cloud)  |
                                  +--------------+---------------+
                                                 |
                                   Outputs 6 Parallel Judgments
                                                 |
                                                 v
                                  +------------------------------+
                                  | Deterministic Policy Engine  |
                                  |       ("Code Decides")       |
                                  +--------------+---------------+
                                      /                      \
                         Hard Vetoes                        Soft Warnings
                        (Execution Blocked)               (Visual Alerts)
                               |                             |
                               v                             v
                   +-----------------------+    +-----------------------+
                   | VETO_TOXIC_ORDER_FLOW |    | NEWS_FREEZE_PROXIMITY |
                   | VETO_LOW_CONFIDENCE   |    | ELEVATED_DRAWDOWN_WARN|
                   +-----------------------+    +-----------------------+
```

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

## 📡 REST API Reference

### `POST /api/v1/predict`
Executes System One prediction and policy evaluation.

**Request Payload Example:**
```json
{
  "symbol": "USTEC",
  "quote": { "bid": 19850.50, "spread": 10.0, "rsi": 68.4 },
  "positionsAnalysis": { "atr": 42.5 },
  "recentCloses": [19810, 19820, 19830, 19840, 19850.5],
  "account": { "balance": 25000, "equity": 24850 }
}
```

**Response Example:**
```json
{
  "success": true,
  "prediction": {
    "predictedScore": 4.2,
    "predictedDirection": "BULLISH_UP",
    "marketRegime": "STRONG_BULL_EXPANSION",
    "confidence": 0.88,
    "signalQualityScore": 4.0,
    "policyVerdict": "APPROVED_TRADE_EXECUTION",
    "isTradeVetoed": false,
    "actionableSetup": "YES - Bullish Setup (75% Conviction | Quality 4/5.0)",
    "softGateWarnings": "NONE"
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
└── README.md                    # Executive AI PM Portfolio Documentation
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
