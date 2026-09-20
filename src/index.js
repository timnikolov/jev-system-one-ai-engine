/**
 * @file index.js
 * @description Express REST API Server for TypeSafe Jev System One AI Engine
 */

import express from 'express';
import cors from 'cors';
import { runTypeSafeJevPrediction, evaluatePendingPredictions, getLastJevInputPayload } from './predictor.js';
import { getPredictionsHistory, getAccuracyStats } from './database.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Healthcheck Endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    system: 'TypeSafe Jev System One AI Engine',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Execute System One Prediction & Policy Engine Evaluation
app.post('/api/v1/predict', async (req, res) => {
  try {
    const liveState = req.body || {};
    const result = await runTypeSafeJevPrediction(liveState);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get Historical Predictions
app.get('/api/v1/predictions', (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 50;
    const history = getPredictionsHistory(limit);
    res.json({ success: true, count: history.length, predictions: history });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get Quantitative Accuracy Statistics
app.get('/api/v1/accuracy', (req, res) => {
  try {
    const stats = getAccuracyStats();
    res.json({ success: true, stats });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Trigger Evaluation of Pending Predictions against Close Price
app.post('/api/v1/evaluate', (req, res) => {
  try {
    const { closePrice } = req.body;
    if (!closePrice) {
      return res.status(400).json({ success: false, error: 'closePrice required' });
    }
    evaluatePendingPredictions(closePrice);
    res.json({ success: true, message: `Evaluated pending predictions against close price ${closePrice}` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Start Server if run directly
if (process.argv[1].endsWith('index.js')) {
  app.listen(PORT, () => {
    console.log(`🚀 [TypeSafe Jev AI Engine] REST Server listening on http://localhost:${PORT}`);
  });
}

export default app;
