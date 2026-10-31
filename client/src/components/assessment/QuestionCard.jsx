import { useEffect, useState } from 'react';
import { Check, HelpCircle } from 'lucide-react';
import { CodeEditor } from './CodeEditor.jsx';
import { formatQuestionTypeLabel } from '../../utils/formatters.js';

export function QuestionCard({
  question,
  questionNumber,
  totalQuestions,
  answer,
  onChangeAnswer,
  programmingLanguage,
  enableNegativeMarking = false,
  codeExecutionConfigured = false,
  onRunCode,
  onSaveCode,
  savedTimestamp = null,
}) {
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    setShowHint(false);
  }, [question?.questionId]);

  if (!question) return null;

  const handleMcqSingleSelect = (optionId) => {
    onChangeAnswer(optionId);
  };

  const handleMcqMultiToggle = (optionId) => {
    const current = Array.isArray(answer) ? answer : [];
    const next = current.includes(optionId)
      ? current.filter((id) => id !== optionId)
      : [...current, optionId];
    onChangeAnswer(next);
  };

  const debuggingObj =
    question.type === 'debugging'
      ? typeof answer === 'object' && answer !== null
        ? answer
        : { code: question.buggyCode || '', issueNotes: '' }
      : null;

  return (
    <article className="surface-panel overflow-hidden">
      <div className="border-b border-slate-200 bg-slate-50/70 px-5 py-3.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs font-semibold text-slate-900">
            Question {questionNumber} of {totalQuestions}
          </span>
          <span className="rounded border border-slate-200 bg-white px-2 py-0.5 text-xs font-medium text-slate-700">
            {formatQuestionTypeLabel(question.type)}
          </span>
          <span className="rounded bg-slate-200/70 px-2 py-0.5 text-xs text-slate-700">
            {question.topic}
          </span>
          <span className="text-xs text-slate-500">{question.difficulty}</span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="font-mono font-semibold text-slate-900">
            {question.marks} {question.marks === 1 ? 'mark' : 'marks'}
          </span>
          {enableNegativeMarking && question.type === 'mcq' && (
            <span className="rounded bg-rose-50 border border-rose-200 px-2 py-0.5 font-mono text-[11px] text-rose-800">
              -25% wrong
            </span>
          )}
        </div>
      </div>

      <div className="p-5 sm:p-6 space-y-5">
        <div className="space-y-2">
          <h2 className="text-base sm:text-lg font-medium text-slate-900 leading-relaxed whitespace-pre-line">
            {question.questionText}
          </h2>

          {question.hint && (
            <div>
              <button
                type="button"
                aria-expanded={showHint}
                onClick={() => setShowHint((prev) => !prev)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 hover:text-blue-900"
              >
                <HelpCircle aria-hidden="true" className="h-3.5 w-3.5" />
                {showHint ? 'Hide Hint' : 'Show Hint'}
              </button>
              {showHint && (
                <div className="mt-2 rounded-md border border-blue-200 bg-blue-50/70 px-3.5 py-2.5 text-xs text-blue-950 leading-relaxed">
                  <span className="font-semibold">Hint: </span>
                  {question.hint}
                </div>
              )}
            </div>
          )}
        </div>

        {question.type === 'mcq' && (
          <div className="space-y-2.5">
            <fieldset>
              <legend className="sr-only">
                {question.allowMultiple
                  ? 'Select all correct options'
                  : 'Select one answer option'}
              </legend>
              <div className="space-y-2.5">
                {(question.options || []).map((opt) => {
                  const isSelected = question.allowMultiple
                    ? Array.isArray(answer) && answer.includes(opt.id)
                    : answer === opt.id;
                  const inputId = `${question.questionId}_opt_${opt.id}`;

                  return (
                    <label
                      key={opt.id}
                      htmlFor={inputId}
                      className={`flex items-start gap-3.5 rounded-md border p-3.5 cursor-pointer transition-colors ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/60'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <input
                        id={inputId}
                        type={question.allowMultiple ? 'checkbox' : 'radio'}
                        name={`mcq_${question.questionId}`}
                        value={opt.id}
                        checked={isSelected}
                        onChange={() =>
                          question.allowMultiple
                            ? handleMcqMultiToggle(opt.id)
                            : handleMcqSingleSelect(opt.id)
                        }
                        className="mt-1 h-4 w-4 border-slate-300 text-blue-600 focus:ring-blue-600"
                      />
                      <span className="font-mono text-xs font-semibold rounded border border-slate-300 bg-slate-50 px-2 py-0.5 text-slate-700 shrink-0">
                        {opt.id}
                      </span>
                      <span className="flex-1 text-sm text-slate-900 leading-relaxed">
                        {opt.text}
                      </span>
                      {isSelected && (
                        <Check
                          aria-hidden="true"
                          className="h-4 w-4 text-blue-600 shrink-0 mt-0.5"
                        />
                      )}
                    </label>
                  );
                })}
              </div>
            </fieldset>

            {((question.allowMultiple && Array.isArray(answer) && answer.length > 0) ||
              (!question.allowMultiple && answer)) && (
              <button
                type="button"
                onClick={() => onChangeAnswer(question.allowMultiple ? [] : '')}
                className="text-xs font-medium text-slate-500 hover:text-slate-800 underline underline-offset-2"
              >
                Clear selected answer
              </button>
            )}
          </div>
        )}

        {question.type === 'coding' && (
          <div className="space-y-5">
            <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4 space-y-3 text-xs sm:text-sm">
              {question.problemStatement &&
                question.problemStatement !== question.questionText && (
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                      Problem Specification
                    </h3>
                    <p className="mt-1 text-slate-800 whitespace-pre-line leading-relaxed">
                      {question.problemStatement}
                    </p>
                  </div>
                )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Input Format
                  </h4>
                  <p className="mt-1 text-xs text-slate-700 leading-relaxed">
                    {question.inputFormat}
                  </p>
                </div>
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Output Format
                  </h4>
                  <p className="mt-1 text-xs text-slate-700 leading-relaxed">
                    {question.outputFormat}
                  </p>
                </div>
              </div>

              {Array.isArray(question.constraints) && question.constraints.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Constraints
                  </h4>
                  <ul className="mt-1 flex flex-wrap gap-2">
                    {question.constraints.map((item, i) => (
                      <li
                        key={i}
                        className="rounded border border-slate-200 bg-white px-2 py-0.5 font-mono text-xs text-slate-800"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Example Input
                  </h4>
                  <pre className="code-block">{question.exampleInput || '(none)'}</pre>
                </div>
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Example Output
                  </h4>
                  <pre className="code-block">{question.exampleOutput || '(none)'}</pre>
                </div>
              </div>
            </div>

            <CodeEditor
              value={typeof answer === 'string' ? answer : question.starterCode || ''}
              onChange={(code) => onChangeAnswer(code)}
              starterCode={question.starterCode || ''}
              language={programmingLanguage || 'JavaScript'}
              codeExecutionConfigured={codeExecutionConfigured}
              onRunCode={onRunCode}
              onSaveCode={onSaveCode}
              savedTimestamp={savedTimestamp}
              showExecutionControls={true}
            />
          </div>
        )}

        {question.type === 'debugging' && debuggingObj && (
          <div className="space-y-4">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Original Defective Snippet
                </h3>
              </div>
              <pre className="code-block">{question.buggyCode}</pre>
              {question.expectedBehavior && (
                <p className="text-xs text-slate-700 pt-1">
                  <span className="font-semibold text-slate-900">Expected Behavior: </span>
                  {question.expectedBehavior}
                </p>
              )}
            </div>

            <CodeEditor
              label="Corrected Implementation"
              value={debuggingObj.code}
              onChange={(updatedCode) =>
                onChangeAnswer({
                  ...debuggingObj,
                  code: updatedCode,
                })
              }
              starterCode={question.buggyCode}
              language={programmingLanguage || 'JavaScript'}
              showExecutionControls={false}
            />

            <div>
              <label
                htmlFor={`debug_notes_${question.questionId}`}
                className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
              >
                Root Cause Summary (Optional)
              </label>
              <textarea
                id={`debug_notes_${question.questionId}`}
                rows={3}
                value={debuggingObj.issueNotes}
                onChange={(e) =>
                  onChangeAnswer({
                    ...debuggingObj,
                    issueNotes: e.target.value,
                  })
                }
                placeholder="Briefly describe the bug you identified and why your fix resolves it..."
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 bg-white placeholder:text-slate-400 focus:border-blue-600"
              />
            </div>
          </div>
        )}

        {question.type === 'conceptual' && (
          <div>
            <label
              htmlFor={`conceptual_${question.questionId}`}
              className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
            >
              Written Technical Response
            </label>
            <textarea
              id={`conceptual_${question.questionId}`}
              rows={7}
              value={typeof answer === 'string' ? answer : ''}
              onChange={(e) => onChangeAnswer(e.target.value)}
              placeholder="Write a clear, structured explanation addressing the core technical concepts..."
              className="w-full rounded-md border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 bg-white placeholder:text-slate-400 focus:border-blue-600 leading-relaxed"
            />
            <div className="mt-1.5 flex justify-end text-xs font-mono text-slate-500">
              {String(answer || '')
                .trim()
                .split(/\s+/)
                .filter(Boolean).length}{' '}
              words
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
