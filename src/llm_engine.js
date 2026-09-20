/**
 * @file llm_engine.js
 * @description Multi-Provider LLM Engine supporting Gemini, OpenAI, Local Qwen, and TypeSafe Cloud API
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONFIG_FILE = path.join(__dirname, '..', 'config.json');

export class LLMEngine {
  static loadConfig() {
    const defaults = {
      provider: 'openai',
      typesafeApiKey: process.env.TYPESAFE_API_KEY || '',
      geminiApiKey: process.env.GEMINI_API_KEY || '',
      geminiModel: 'gemini-2.5-flash',
      openaiApiKey: process.env.OPENAI_API_KEY || '',
      openaiBaseUrl: process.env.OPENAI_BASE_URL || 'http://127.0.0.1:1234/v1',
      openaiModel: process.env.OPENAI_MODEL || 'qwen/qwen3.8-27b'
    };

    if (fs.existsSync(CONFIG_FILE)) {
      try {
        const fileContent = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
        return { ...defaults, ...fileContent };
      } catch (e) {
        console.error('Error reading config.json:', e.message);
      }
    }
    return defaults;
  }

  /**
   * System One Neural Predictor - Queries the neural LLM to produce 6 parallel judgments
   * @param {Object} statePayload Rich telemetry state JSON
   * @returns {Promise<Object|null>} Neural judgment results or null if fallback required
   */
  static async askSystemOneJev(statePayload) {
    const config = this.loadConfig();
    const systemPrompt = `You are TypeSafe System One Jev AI Predictor.
Analyze the provided market state JSON and answer the 6 System One parallel judgments strictly as valid JSON without markdown code blocks:

Input State Payload:
${JSON.stringify(statePayload, null, 2)}

Output JSON Schema:
{
  "candle_score": <number 1.0 to 5.0, where 1.0 = Extreme Bear, 3.0 = Neutral, 5.0 = Extreme Bull>,
  "confidence": <number 0.50 to 0.95>,
  "regime": "STRONG_BULL_EXPANSION" | "STRONG_BEAR_EXPANSION" | "RANGE_ACCUMULATION_ZONE_A" | "HIGH_VOLATILITY_CHOP",
  "signal_quality": <number 1.0 to 5.0 rating of technical confluence and setup quality>,
  "is_market_toxic": <number 0.0 to 1.0 probability of toxic order flow or erratic chop>,
  "is_regime_transitioning": <number 0.0 to 1.0 probability of structural regime changepoint>,
  "noul_conviction": <number 0.10 to 0.95 probability that setup is actionable>
}`;

    // 1. Try TypeSafe Cloud API if key is present
    if (config.typesafeApiKey) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 3000);
        const response = await fetch('https://api.typesafe.ai/v1/systemone', {
          method: 'POST',
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.typesafeApiKey}`
          },
          body: JSON.stringify({
            model: 'jev-latest',
            state: statePayload
          })
        });
        clearTimeout(timer);

        if (response.ok) {
          const resData = await response.json();
          const answers = resData.answers || {};
          return {
            score: parseFloat(answers.candle_score?.score) + 1.0 || 3.0,
            confidence: parseFloat(answers.candle_score?.confidence) || 0.85,
            regime: answers.regime?.choice || 'RANGE_ACCUMULATION_ZONE_A',
            signalQuality: parseFloat(answers.signal_quality?.score) + 1.0 || 4.0,
            isToxic: parseFloat(answers.is_market_toxic?.noul) || 0.15,
            isRegimeTransition: parseFloat(answers.is_regime_transitioning?.noul) || 0.20,
            noul: parseFloat(answers.is_setup_actionable?.noul) || 0.50,
            source: 'TYPESAFE_CLOUD_JEV'
          };
        }
      } catch (e) {
        // Fall through
      }
    }

    // 2. Try OpenAI / Local LLM Endpoint (e.g. Qwen 3.8 27B / LM Studio / Ollama)
    try {
      if (config.provider === 'openai' || config.openaiBaseUrl) {
        const baseUrl = config.openaiBaseUrl.replace(/\/+$/, '');
        const url = `${baseUrl}/chat/completions`;
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 2000);

        const resp = await fetch(url, {
          method: 'POST',
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.openaiApiKey || 'not-needed'}`
          },
          body: JSON.stringify({
            model: config.openaiModel || 'qwen/qwen3.8-27b',
            messages: [
              { role: 'system', content: 'You are TypeSafe System One Jev AI Predictor.' },
              { role: 'user', content: systemPrompt }
            ],
            temperature: 0.2
          })
        });
        clearTimeout(timer);

        if (resp.ok) {
          const data = await resp.json();
          const rawText = data.choices?.[0]?.message?.content || '';
          const cleaned = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(cleaned);
          return {
            score: parseFloat(parsed.candle_score) || 3.0,
            confidence: parseFloat(parsed.confidence) || 0.85,
            regime: parsed.regime || 'RANGE_ACCUMULATION_ZONE_A',
            signalQuality: parseFloat(parsed.signal_quality) || 4.0,
            isToxic: parseFloat(parsed.is_market_toxic) || 0.15,
            isRegimeTransition: parseFloat(parsed.is_regime_transitioning) || 0.20,
            noul: parseFloat(parsed.noul_conviction) || 0.50,
            source: 'LOCAL_LLM_QWEN'
          };
        }
      }
    } catch (e) {
      // Fall through
    }

    // 3. Try Gemini API
    if (config.geminiApiKey) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.geminiModel || 'gemini-2.5-flash'}:generateContent?key=${config.geminiApiKey}`;
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 3000);

        const resp = await fetch(url, {
          method: 'POST',
          signal: controller.signal,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: systemPrompt }] }]
          })
        });
        clearTimeout(timer);

        if (resp.ok) {
          const data = await resp.json();
          const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
          const cleaned = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(cleaned);
          return {
            score: parseFloat(parsed.candle_score) || 3.0,
            confidence: parseFloat(parsed.confidence) || 0.85,
            regime: parsed.regime || 'RANGE_ACCUMULATION_ZONE_A',
            signalQuality: parseFloat(parsed.signal_quality) || 4.0,
            isToxic: parseFloat(parsed.is_market_toxic) || 0.15,
            isRegimeTransition: parseFloat(parsed.is_regime_transitioning) || 0.20,
            noul: parseFloat(parsed.noul_conviction) || 0.50,
            source: 'GEMINI_VISION_API'
          };
        }
      } catch (e) {
        // Fall through
      }
    }

    return null;
  }
}
