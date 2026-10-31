import { Check, Flag } from 'lucide-react';
import { isQuestionAnswered } from '../../hooks/useAssessmentProgress.js';

export function QuestionNavigation({
  questions = [],
  currentIndex,
  answers = {},
  markedForReview = [],
  onSelectQuestion,
}) {
  const answeredCount = questions.filter((q) =>
    isQuestionAnswered(q, answers[q.questionId])
  ).length;
  const reviewCount = markedForReview.length;
  const unansweredCount = questions.length - answeredCount;

  return (
    <div className="surface-panel p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-600">
          Question Navigator
        </h2>
        <span className="font-mono text-xs text-slate-500">
          {answeredCount}/{questions.length} answered
        </span>
      </div>

      <div
        role="navigation"
        aria-label="Assessment questions"
        className="grid grid-cols-5 sm:grid-cols-8 lg:grid-cols-5 gap-2"
      >
        {questions.map((q, idx) => {
          const isCurrent = idx === currentIndex;
          const isAnswered = isQuestionAnswered(q, answers[q.questionId]);
          const isFlagged = markedForReview.includes(q.questionId);

          let buttonClasses =
            'border-slate-200 bg-white text-slate-700 hover:border-slate-400';
          if (isCurrent) {
            buttonClasses =
              'border-blue-600 bg-blue-600 text-white ring-2 ring-blue-200';
          } else if (isFlagged && isAnswered) {
            buttonClasses =
              'border-amber-500 bg-emerald-50 text-emerald-900';
          } else if (isFlagged) {
            buttonClasses =
              'border-amber-400 bg-amber-50 text-amber-900';
          } else if (isAnswered) {
            buttonClasses =
              'border-emerald-300 bg-emerald-50 text-emerald-900';
          }

          const stateDescription = [
            `Question ${idx + 1}`,
            isCurrent ? 'current' : '',
            isAnswered ? 'answered' : 'unanswered',
            isFlagged ? 'marked for review' : '',
          ]
            .filter(Boolean)
            .join(', ');

          return (
            <button
              key={q.questionId}
              type="button"
              onClick={() => onSelectQuestion(idx)}
              aria-label={stateDescription}
              aria-current={isCurrent ? 'step' : undefined}
              className={`relative flex h-9 items-center justify-center rounded-md border font-mono text-xs font-semibold transition-colors cursor-pointer ${buttonClasses}`}
            >
              <span>{idx + 1}</span>
              {isFlagged && (
                <Flag
                  aria-hidden="true"
                  className={`absolute top-0.5 right-0.5 h-2.5 w-2.5 ${
                    isCurrent ? 'text-amber-200' : 'text-amber-600'
                  }`}
                />
              )}
              {!isFlagged && isAnswered && !isCurrent && (
                <Check
                  aria-hidden="true"
                  className="absolute bottom-0.5 right-0.5 h-2.5 w-2.5 text-emerald-700"
                />
              )}
            </button>
          );
        })}
      </div>

      <dl className="mt-4 pt-3 border-t border-slate-200 grid grid-cols-3 gap-2 text-[11px] text-slate-600">
        <div>
          <dt className="text-slate-500">Answered</dt>
          <dd className="font-mono font-semibold text-emerald-800">{answeredCount}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Unanswered</dt>
          <dd className="font-mono font-semibold text-slate-800">{unansweredCount}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Flagged</dt>
          <dd className="font-mono font-semibold text-amber-800">{reviewCount}</dd>
        </div>
      </dl>
    </div>
  );
}
