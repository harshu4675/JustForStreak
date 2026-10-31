import { getEnv } from '../config/env.js';

let customExecutionTransport = null;

export function setCodeExecutionTransportForTesting(transportFn) {
  customExecutionTransport = transportFn;
}

const PISTON_LANGUAGE_MAP = {
  javascript: { language: 'javascript', version: '*' },
  python: { language: 'python', version: '*' },
  java: { language: 'java', version: '*' },
  c: { language: 'c', version: '*' },
  'c++': { language: 'c++', version: '*' },
  cpp: { language: 'c++', version: '*' },
  sql: { language: 'sqlite3', version: '*' },
};

const JUDGE0_LANGUAGE_IDS = {
  javascript: 63,
  python: 71,
  java: 62,
  c: 50,
  'c++': 54,
  cpp: 54,
  sql: 82,
};

function normalizeOutput(str) {
  return String(str ?? '')
    .replace(/\r\n/g, '\n')
    .trim();
}

/**
 * Executes candidate code against provided test cases ONLY via an external
 * sandboxed code execution service. Never runs code on the Express server.
 */
export async function executeCodeAgainstTestCases({ code, language, testCases = [] }) {
  if (typeof customExecutionTransport === 'function') {
    return customExecutionTransport({ code, language, testCases });
  }

  const env = getEnv();

  if (!env.isCodeExecutionConfigured) {
    return {
      executionAvailable: false,
      status: 'EXECUTION_SERVICE_UNCONFIGURED',
      message:
        'Sandboxed code execution is not configured on this server (CODE_EXECUTION_URL is unset). Your code has been saved with your submission, without automated execution.',
      passedCount: null,
      failedCount: null,
      results: [],
    };
  }

  const langKey = String(language || 'javascript').trim().toLowerCase();
  const results = [];
  let passedCount = 0;

  for (let i = 0; i < testCases.length; i += 1) {
    const tc = testCases[i];
    const singleRun = await runSingleTestCaseInSandbox({
      env,
      code,
      langKey,
      stdin: tc.input || '',
    });

    if (!singleRun.reachable) {
      return {
        executionAvailable: false,
        status: 'EXECUTION_SERVICE_ERROR',
        message: singleRun.errorMessage || 'Sandboxed execution service could not be reached.',
        passedCount: null,
        failedCount: null,
        results: [],
      };
    }

    const expectedNormalized = normalizeOutput(tc.expectedOutput);
    const actualNormalized = normalizeOutput(singleRun.stdout);
    const passed = !singleRun.stderr && actualNormalized === expectedNormalized;

    if (passed) {
      passedCount += 1;
    }

    results.push({
      index: i + 1,
      isHidden: Boolean(tc.isHidden),
      input: tc.isHidden ? '[Hidden test case]' : String(tc.input || ''),
      expectedOutput: tc.isHidden ? '[Hidden expected output]' : String(tc.expectedOutput || ''),
      actualOutput: tc.isHidden
        ? passed
          ? '[Matched expected output]'
          : '[Did not match expected output]'
        : String(singleRun.stdout || '').slice(0, 2000),
      stderr: String(singleRun.stderr || '').slice(0, 1500),
      passed,
    });
  }

  return {
    executionAvailable: true,
    status: 'EXECUTED',
    message: `Executed ${testCases.length} test case(s) in isolated sandbox.`,
    passedCount,
    failedCount: testCases.length - passedCount,
    results,
  };
}

async function runSingleTestCaseInSandbox({ env, code, langKey, stdin }) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), env.codeExecutionTimeoutMs);

  try {
    if (env.codeExecutionProvider === 'judge0') {
      const languageId = JUDGE0_LANGUAGE_IDS[langKey] || 63;
      const headers = { 'Content-Type': 'application/json' };
      if (env.codeExecutionApiKey) {
        headers['X-Auth-Token'] = env.codeExecutionApiKey;
      }
      const sep = env.codeExecutionUrl.includes('?') ? '&' : '?';
      const url = `${env.codeExecutionUrl}${sep}base64_encoded=false&wait=true`;

      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          source_code: code,
          language_id: languageId,
          stdin,
          cpu_time_limit: 5,
          memory_limit: 128000,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        return {
          reachable: false,
          errorMessage: `Execution sandbox returned HTTP ${res.status}.`,
        };
      }

      const data = await res.json();
      return {
        reachable: true,
        stdout: data.stdout || '',
        stderr: data.stderr || data.compile_output || '',
      };
    }

    // Default: Piston-compatible /execute endpoint
    const pistonSpec = PISTON_LANGUAGE_MAP[langKey] || PISTON_LANGUAGE_MAP.javascript;
    const headers = { 'Content-Type': 'application/json' };
    if (env.codeExecutionApiKey) {
      headers.Authorization = `Bearer ${env.codeExecutionApiKey}`;
    }

    const res = await fetch(env.codeExecutionUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        language: pistonSpec.language,
        version: pistonSpec.version,
        files: [{ content: code }],
        stdin,
        run_timeout: 5000,
        compile_timeout: 10000,
        run_memory_limit: 134217728,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      return {
        reachable: false,
        errorMessage: `Execution sandbox returned HTTP ${res.status}.`,
      };
    }

    const data = await res.json();
    const compileStderr = data?.compile?.stderr || '';
    const runStderr = data?.run?.stderr || '';
    return {
      reachable: true,
      stdout: data?.run?.stdout || '',
      stderr: [compileStderr, runStderr].filter(Boolean).join('\n'),
    };
  } catch (error) {
    return {
      reachable: false,
      errorMessage:
        error?.name === 'AbortError'
          ? 'Sandboxed code execution timed out.'
          : 'Could not connect to configured sandboxed execution service.',
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
