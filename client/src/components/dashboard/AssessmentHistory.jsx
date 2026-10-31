import { Link } from 'react-router-dom';
import { ArrowUpRight, RotateCcw } from 'lucide-react';
import { formatDateTime, formatDurationReadable } from '../../utils/formatters.js';
import { clearStoredAssessmentProgress } from '../../hooks/useAssessmentProgress.js';

export function AssessmentHistory({ items = [] }) {
  return (
    <div className="surface-panel overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-600">
            <tr>
              <th scope="col" className="px-4 py-3">Assessment</th>
              <th scope="col" className="px-4 py-3">Skill Level</th>
              <th scope="col" className="px-4 py-3">Score</th>
              <th scope="col" className="px-4 py-3 hidden sm:table-cell">Duration</th>
              <th scope="col" className="px-4 py-3 hidden md:table-cell">Completed</th>
              <th scope="col" className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {items.map((row) => {
              const badgeCls =
                row.percentage >= 80
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : row.percentage >= 50
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : 'bg-rose-50 text-rose-800 border-rose-200';

              return (
                <tr key={row.attemptId} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3.5">
                    <div className="font-medium text-slate-900">{row.title}</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {row.subject}
                      {row.programmingLanguage ? ` · ${row.programmingLanguage}` : ''} ·{' '}
                      {row.assessmentType}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-xs font-medium text-slate-700 whitespace-nowrap">
                    {row.skillLevel}
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center rounded border px-2 py-0.5 font-mono text-xs font-semibold ${badgeCls}`}
                    >
                      {row.percentage}%
                    </span>
                    <span className="ml-2 font-mono text-xs text-slate-500">
                      ({row.score}/{row.maximumScore})
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-mono text-xs text-slate-600 hidden sm:table-cell whitespace-nowrap">
                    {formatDurationReadable(row.timeTaken)}
                  </td>
                  <td className="px-4 py-3.5 text-xs text-slate-500 hidden md:table-cell whitespace-nowrap">
                    {formatDateTime(row.completedAt)}
                  </td>
                  <td className="px-4 py-3.5 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-3 text-xs">
                      <Link
                        to={`/assessments/${row.assessmentId}/take`}
                        onClick={() => clearStoredAssessmentProgress(row.assessmentId)}
                        className="inline-flex items-center gap-1 font-medium text-slate-600 hover:text-slate-900"
                      >
                        <RotateCcw aria-hidden="true" className="h-3 w-3" />
                        Retake
                      </Link>
                      <Link
                        to={`/assessments/${row.assessmentId}/result?attemptId=${encodeURIComponent(row.attemptId)}`}
                        className="inline-flex items-center gap-1 font-medium text-blue-600 hover:text-blue-800"
                      >
                        Review
                        <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
