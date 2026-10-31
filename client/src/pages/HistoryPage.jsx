import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { History, Plus } from 'lucide-react';
import { assessmentService } from '../services/assessmentService.js';
import { SKILL_LEVELS, SUBJECT_CATALOG } from '../utils/assessmentCatalog.js';
import { AssessmentHistory } from '../components/dashboard/AssessmentHistory.jsx';
import { Select } from '../components/ui/Select.jsx';
import { Button } from '../components/ui/Button.jsx';
import { LoadingState } from '../components/ui/LoadingState.jsx';
import { ErrorState } from '../components/ui/ErrorState.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';

export function HistoryPage() {
  const navigate = useNavigate();
  const [subject, setSubject] = useState('');
  const [skillLevel, setSkillLevel] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await assessmentService.getHistory({ subject, skillLevel });
      setItems(data.history || []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [subject, skillLevel]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <p className="section-label">Records</p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900">
            Assessment History
          </h1>
        </div>
        <Button variant="primary" onClick={() => navigate('/configure')}>
          <Plus className="h-4 w-4" />
          New Assessment
        </Button>
      </div>

      <div className="surface-panel p-4 grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
        <Select
          label="Filter by Subject"
          placeholder="All Subjects"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          options={SUBJECT_CATALOG.map((s) => s.name)}
        />
        <Select
          label="Filter by Skill Level"
          placeholder="All Skill Levels"
          value={skillLevel}
          onChange={(e) => setSkillLevel(e.target.value)}
          options={SKILL_LEVELS.map((l) => l.name)}
        />
        <div>
          {(subject || skillLevel) && (
            <Button
              variant="secondary"
              size="md"
              onClick={() => {
                setSubject('');
                setSkillLevel('');
              }}
            >
              Reset Filters
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <LoadingState
          compact
          title="Loading history"
          description="Fetching completed assessment records..."
        />
      ) : error ? (
        <ErrorState
          title="Unable to Load History"
          message={error.message}
          code={error.code}
          onRetry={fetchHistory}
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={History}
          title="No matching assessment records"
          description={
            subject || skillLevel
              ? 'No completed assessments match the active filters.'
              : 'You have not completed any assessments yet.'
          }
          action={
            <Button variant="accent" onClick={() => navigate('/configure')}>
              Configure an Assessment
            </Button>
          }
        />
      ) : (
        <AssessmentHistory items={items} />
      )}
    </div>
  );
}
