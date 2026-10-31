import { useMemo, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { java } from '@codemirror/lang-java';
import { cpp } from '@codemirror/lang-cpp';
import { sql } from '@codemirror/lang-sql';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import {
  CheckCircle2,
  Info,
  Play,
  RotateCcw,
  Save,
  XCircle,
} from 'lucide-react';
import { Button } from '../ui/Button.jsx';

function resolveLanguageExtension(language) {
  const key = String(language || '').trim().toLowerCase();
  if (key === 'javascript' || key === 'react') return [javascript({ jsx: true })];
  if (key === 'python') return [python()];
  if (key === 'java') return [java()];
  if (key === 'c' || key === 'c++' || key === 'cpp') return [cpp()];
  if (key === 'sql') return [sql()];
  if (key === 'html') return [html()];
  if (key === 'css') return [css()];
  return [javascript()];
}

export function CodeEditor({
  value,
  onChange,
  starterCode = '',
  language = 'JavaScript',
  codeExecutionConfigured = false,
  onRunCode,
  onSaveCode,
  savedTimestamp = null,
  showExecutionControls = true,
  label = 'Solution Editor',
}) {
  const [usePlainEditor, setUsePlainEditor] = useState(false);
  const [running, setRunning] = useState(false);
  const [runOutcome, setRunOutcome] = useState(null);
  const [runError, setRunError] = useState('');

  const extensions = useMemo(() => resolveLanguageExtension(language), [language]);

  const handleRun = async () => {
    if (!onRunCode) return;
    setRunning(true);
    setRunError('');
    try {
      const result = await onRunCode(value);
      setRunOutcome(result);
    } catch (err) {
      setRunError(err?.message || 'Unable to process code run request.');
    } finally {
      setRunning(false);
    }
  };

  const handleReset = () => {
    onChange(starterCode || '');
    setRunOutcome(null);
    setRunError('');
  };

  const handleTabInPlainTextarea = (event) => {
    if (event.key === 'Tab') {
      event.preventDefault();
      const target = event.target;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const updated = `${value.slice(0, start)}  ${value.slice(end)}`;
      onChange(updated);
      window.requestAnimationFrame(() => {
        target.selectionStart = start + 2;
        target.selectionEnd = start + 2;
      });
    }
  };

  return (
    <div className="rounded-lg border border-slate-300 bg-white overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-100 px-3.5 py-2 border-b border-slate-200">
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-semibold text-slate-800">{label}</span>
          {language && (
            <span className="rounded bg-white border border-slate-200 px-2 py-0.5 font-mono text-[11px] text-slate-700">
              {language}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setUsePlainEditor((prev) => !prev)}
            className="text-xs text-slate-600 hover:text-slate-900 underline underline-offset-2 px-1.5 py-0.5"
          >
            {usePlainEditor ? 'Use Syntax Editor' : 'Plain Text Mode'}
          </button>
          {starterCode && (
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              <RotateCcw aria-hidden="true" className="h-3 w-3" />
              Reset
            </button>
          )}
        </div>
      </div>

      {showExecutionControls && !codeExecutionConfigured && (
        <div className="flex items-start gap-2 bg-amber-50/80 border-b border-amber-200 px-3.5 py-2 text-xs text-amber-900">
          <Info aria-hidden="true" className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
          <span>
            Editor-only mode: no remote sandbox execution service (<code className="font-mono">CODE_EXECUTION_URL</code>) is configured on this server. Your code is saved automatically and recorded on submission without live execution.
          </span>
        </div>
      )}

      <div className="min-h-[260px] text-sm">
        {usePlainEditor ? (
          <textarea
            aria-label={`${label} (${language || 'code'})`}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleTabInPlainTextarea}
            spellCheck={false}
            rows={13}
            placeholder="Write your code here..."
            className="w-full p-3.5 font-mono text-xs sm:text-sm text-slate-900 bg-white focus:outline-none resize-y leading-relaxed"
          />
        ) : (
          <CodeMirror
            value={value}
            height="290px"
            extensions={extensions}
            onChange={(val) => onChange(val)}
            basicSetup={{
              lineNumbers: true,
              foldGutter: false,
              highlightActiveLine: true,
              autocompletion: true,
            }}
          />
        )}
      </div>

      {showExecutionControls && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-3.5 py-2.5">
          <div className="text-xs text-slate-600">
            {savedTimestamp ? (
              <span className="inline-flex items-center gap-1.5 text-emerald-800 font-medium">
                <CheckCircle2 aria-hidden="true" className="h-3.5 w-3.5 text-emerald-700" />
                Code saved for submission ({new Date(savedTimestamp).toLocaleTimeString()})
              </span>
            ) : (
              <span>Changes are stored locally as you type.</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onRunCode && (
              <Button
                variant="secondary"
                size="sm"
                loading={running}
                onClick={handleRun}
              >
                <Play className="h-3.5 w-3.5" />
                Run Code
              </Button>
            )}
            {onSaveCode && (
              <Button
                variant="accent"
                size="sm"
                onClick={() => onSaveCode(value)}
              >
                <Save className="h-3.5 w-3.5" />
                Submit Code
              </Button>
            )}
          </div>
        </div>
      )}

      {runError && (
        <div role="alert" className="border-t border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-800">
          {runError}
        </div>
      )}

      {runOutcome && (
        <div className="border-t border-slate-200 bg-slate-900 text-slate-100 p-3.5 text-xs space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold uppercase tracking-wider text-slate-300">
              {runOutcome.executionAvailable
                ? 'Sandbox Sample Test Output'
                : 'Execution Service Status'}
            </span>
            {runOutcome.executionAvailable && (
              <span className="font-mono text-slate-300">
                Passed {runOutcome.passedCount}/
                {(runOutcome.passedCount || 0) + (runOutcome.failedCount || 0)} sample case(s)
              </span>
            )}
          </div>

          <p className="text-slate-300 leading-relaxed">{runOutcome.message}</p>

          {runOutcome.executionAvailable &&
            Array.isArray(runOutcome.results) &&
            runOutcome.results.map((tc) => (
              <div
                key={tc.index}
                className="rounded border border-slate-700 bg-slate-800/80 p-2.5 space-y-1 font-mono"
              >
                <div className="flex items-center gap-1.5 font-sans font-medium">
                  {tc.passed ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5 text-rose-400" />
                  )}
                  <span>
                    Sample Case {tc.index}: {tc.passed ? 'Passed' : 'Failed'}
                  </span>
                </div>
                <div>Input: {tc.input || '(empty)'}</div>
                <div>Expected: {tc.expectedOutput}</div>
                <div>Actual: {tc.actualOutput || '(no stdout)'}</div>
                {tc.stderr && (
                  <div className="text-rose-300 whitespace-pre-wrap">Stderr: {tc.stderr}</div>
                )}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
