import { getEnv } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

let customCompletionTransport = null;

/**
 * Allows automated tests to inject a deterministic transport without mutating production routes.
 */
export function setAiTransportForTesting(transportFn) {
  customCompletionTransport = transportFn;
}

export async function requestStructuredJsonFromAi({ systemPrompt, userPrompt, temperature = 0.3 }) {
  if (typeof customCompletionTransport === 'function') {
    return customCompletionTransport({ systemPrompt, userPrompt, temperature });
  }

  const env = getEnv();

  if (!env.isAiConfigured) {
    throw new AppError(
      'AI assessment generation is not configured. Set AI_PROVIDER, AI_API_KEY, and AI_MODEL in server/.env, then restart the backend server.',
      503,
      'AI_NOT_CONFIGURED'
    );
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), env.aiRequestTimeoutMs);

  try {
    if (env.aiProvider === 'openai' || env.aiProvider === 'openai_compatible') {
      return await callOpenAiCompatible({ env, systemPrompt, userPrompt, temperature, signal: controller.signal });
    }
    if (env.aiProvider === 'gemini') {
      return await callGemini({ env, systemPrompt, userPrompt, temperature, signal: controller.signal });
    }
    if (env.aiProvider === 'anthropic') {
      return await callAnthropic({ env, systemPrompt, userPrompt, temperature, signal: controller.signal });
    }

    throw new AppError(
      `Unsupported AI_PROVIDER "${env.aiProvider}". Supported values: openai, gemini, anthropic, openai_compatible.`,
      500,
      'AI_INVALID_PROVIDER'
    );
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    if (error?.name === 'AbortError') {
      throw new AppError(
        'The AI provider timed out while generating the assessment. Try reducing the question count or retrying shortly.',
        504,
        'AI_TIMEOUT'
      );
    }
    throw new AppError(
      `Failed to reach the configured AI provider (${env.aiProvider}). Check network connectivity and AI_BASE_URL / AI_API_KEY settings.`,
      502,
      'AI_NETWORK_ERROR'
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

async function callOpenAiCompatible({ env, systemPrompt, userPrompt, temperature, signal }) {
  const endpoint =
    env.aiBaseUrl ||
    'https://api.openai.com/v1/chat/completions';

  if (env.aiProvider === 'openai_compatible' && !env.aiBaseUrl) {
    throw new AppError(
      'AI_BASE_URL is required when AI_PROVIDER is set to openai_compatible.',
      503,
      'AI_NOT_CONFIGURED'
    );
  }

  const headers = {
    'Content-Type': 'application/json',
  };
  if (env.aiApiKey) {
    headers.Authorization = `Bearer ${env.aiApiKey}`;
  }

  const body = {
    model: env.aiModel,
    temperature,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
  };

  if (env.aiProvider === 'openai') {
    body.response_format = { type: 'json_object' };
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    await throwNormalizedProviderError(response, env.aiProvider);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new AppError('AI provider returned an empty completion.', 502, 'AI_EMPTY_RESPONSE');
  }
  return content;
}

async function callGemini({ env, systemPrompt, userPrompt, temperature, signal }) {
  const baseUrl =
    env.aiBaseUrl ||
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(env.aiModel)}:generateContent`;
  const separator = baseUrl.includes('?') ? '&' : '?';
  const url = `${baseUrl}${separator}key=${encodeURIComponent(env.aiApiKey)}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: systemPrompt }],
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: userPrompt }],
        },
      ],
      generationConfig: {
        temperature,
        responseMimeType: 'application/json',
      },
    }),
    signal,
  });

  if (!response.ok) {
    await throwNormalizedProviderError(response, 'gemini');
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || '')
    .join('');

  if (!text) {
    throw new AppError('Gemini API returned an empty response.', 502, 'AI_EMPTY_RESPONSE');
  }
  return text;
}

async function callAnthropic({ env, systemPrompt, userPrompt, temperature, signal }) {
  const endpoint = env.aiBaseUrl || 'https://api.anthropic.com/v1/messages';

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': env.aiApiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: env.aiModel,
      max_tokens: 8192,
      temperature,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
    signal,
  });

  if (!response.ok) {
    await throwNormalizedProviderError(response, 'anthropic');
  }

  const data = await response.json();
  const text = data?.content
    ?.filter((item) => item.type === 'text')
    .map((item) => item.text)
    .join('');

  if (!text) {
    throw new AppError('Anthropic API returned an empty response.', 502, 'AI_EMPTY_RESPONSE');
  }
  return text;
}

async function throwNormalizedProviderError(response, providerName) {
  let providerMessage = '';
  try {
    const errJson = await response.json();
    providerMessage =
      errJson?.error?.message ||
      errJson?.message ||
      '';
  } catch {
    // Ignore unparseable upstream body
  }

  if (response.status === 401 || response.status === 403) {
    throw new AppError(
      `Authentication with AI provider (${providerName}) failed. Verify that AI_API_KEY and AI_MODEL in server/.env are valid.`,
      502,
      'AI_AUTH_ERROR'
    );
  }

  if (response.status === 429) {
    throw new AppError(
      `AI provider (${providerName}) rate limit or quota exceeded. Wait a moment or check your provider billing quota before retrying.`,
      429,
      'AI_RATE_LIMITED'
    );
  }

  const safeDetail = providerMessage ? ` (${providerMessage.slice(0, 180)})` : '';
  throw new AppError(
    `AI provider (${providerName}) returned HTTP ${response.status}${safeDetail}.`,
    502,
    'AI_UPSTREAM_ERROR'
  );
}
