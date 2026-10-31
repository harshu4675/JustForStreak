import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  Plus,
  Sparkles,
  X,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth.js';
import { assessmentService } from '../services/assessmentService.js';
import {
  ASSESSMENT_TYPES,
  DURATION_PRESETS,
  QUESTION_COUNT_PRESETS,
  SKILL_LEVELS,
  SUBJECT_CATALOG,
  findSubjectConfig,
} from '../utils/assessmentCatalog.js';
import { validateAssessmentConfiguration } from '../utils/validation.js';
import { Button } from '../components/ui/Button.jsx';
import { Input } from '../components/ui/Input.jsx';
import { Select } from '../components/ui/Select.jsx';
import { Checkbox } from '../components/ui/Checkbox.jsx';
import { RadioGroup } from '../components/ui/RadioGroup.jsx';
import { ErrorState } from '../components/ui/ErrorState.jsx';

export function ConfigureAssessmentPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const abortRef = useRef(null);

  const initialSubject = useMemo(() => {
    const param = searchParams.get('subject');
    return findSubjectConfig(param) ? param : 'JavaScript';
  }, [searchParams]);

  const initialSubjectMeta = findSubjectConfig(initialSubject);

  const initialLevel = useMemo(() => {
    const param = searchParams.get('skillLevel');
    return SKILL_LEVELS.some((l) => l.name === param) ? param : 'Intermediate';
  }, [searchParams]);

  const initialType = useMemo(() => {
    const param = searchParams.get('assessmentType');
    return ASSESSMENT_TYPES.some((t) => t.value === param)
      ? param
      : 'Mixed Assessment';
  }, [searchParams]);

  const initialLanguage = useMemo(() => {
    const param = searchParams.get('programmingLanguage');
    if (param) return param;
    return initialSubjectMeta?.defaultLanguage || '';
  }, [searchParams, initialSubjectMeta]);

  const initialTopics = useMemo(() => {
    const raw = searchParams.get('topics');
    if (!raw) return [];
    return raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }, [searchParams]);

  const [form, setForm] = useState({
    subject: initialSubject,
    programmingLanguage: initialLanguage,
    skillLevel: initialLevel,
    assessmentType: initialType,
    questionCountMode: '10',
    questionCount: 10,
    durationMode: '30',
    durationMinutes: 30,
    includeExplanations: true,
    includeHints: false,
    enableNegativeMarking: false,
    enableTimer: true,
    randomizeQuestions: false,
    selectedTopics: initialTopics,
  });

  const [customTopicInput, setCustomTopicInput] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [capabilities, setCapabilities] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [generationError, setGenerationError] = useState(null);

  const subjectMeta = useMemo(() => findSubjectConfig(form.subject), [form.subject]);

  useEffect(() => {
    let active = true;
    assessmentService
      .getCatalogMeta()
      .then((data) => {
        if (active && data?.capabilities) {
          setCapabilities(data.capabilities);
        }
      })
      .catch(() => {
        // Non-blocking capability precheck
      });
    return () => {
      active = false;
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, []);

  const handleSubjectChange = (nextSubjectName) => {
    const nextMeta = findSubjectConfig(nextSubjectName);
    let nextLanguage = '';
    if (nextMeta) {
      if (nextMeta.languageMode === 'fixed' || nextMeta.languageMode === 'required') {
        nextLanguage = nextMeta.defaultLanguage || nextMeta.supportedLanguages[0] || '';
      }
    }

    let nextAssessmentType = form.assessmentType;
    if (
      nextMeta &&
      !nextMeta.supportsCodeQuestions &&
      (nextAssessmentType === 'Coding Questions' ||
        nextAssessmentType === 'Debugging Questions')
    ) {
      nextAssessmentType = 'Multiple Choice Questions';
    }

    setForm((prev) => ({
      ...prev,
      subject: nextSubjectName,
      programmingLanguage: nextLanguage,
      assessmentType: nextAssessmentType,
      selectedTopics: [],
    }));
    setFieldErrors({});
    setGenerationError(null);
  };

  const toggleTopic = (topic) => {
    setForm((prev) => {
      const exists = prev.selectedTopics.includes(topic);
      const next = exists
        ? prev.selectedTopics.filter((t) => t !== topic)
        : [...prev.selectedTopics, topic].slice(0, 12);
      return { ...prev, selectedTopics: next };
    });
  };

  const handleAddCustomTopic = () => {
    const trimmed = customTopicInput.trim();
    if (!trimmed || trimmed.length > 80) return;
    if (!form.selectedTopics.includes(trimmed) && form.selectedTopics.length < 12) {
      setForm((prev) => ({
        ...prev,
        selectedTopics: [...prev.selectedTopics, trimmed],
      }));
    }
    setCustomTopicInput('');
  };

  const submitGeneration = async () => {
    const errors = validateAssessmentConfiguration(form);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    setGenerating(true);
    setGenerationError(null);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const assessment = await assessmentService.generateAssessment(
        {
          subject: form.subject,
          programmingLanguage: form.programmingLanguage,
          skillLevel: form.skillLevel,
          assessmentType: form.assessmentType,
          questionCount: Number(form.questionCount),
          durationMinutes: Number(form.durationMinutes),
          includeExplanations: form.includeExplanations,
          includeHints: form.includeHints,
          enableNegativeMarking: form.enableNegativeMarking,
          enableTimer: form.enableTimer,
          randomizeQuestions: form.randomizeQuestions,
          selectedTopics: form.selectedTopics,
        },
        controller.signal
      );

      navigate(`/assessments/${assessment.id}/take`);
    } catch (error) {
      if (error?.code !== 'REQUEST_ABORTED') {
        setGenerationError(error);
        if (error?.details && typeof error.details === 'object') {
          setFieldErrors(error.details);
        }
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleFormSubmit = (event) => {
    event.preventDefault();
    submitGeneration();
  };

  const showLanguageSelect =
    subjectMeta &&
    (subjectMeta.languageMode === 'required' ||
      subjectMeta.languageMode === 'optional');

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="border-b border-slate-200 pb-5 mb-8">
        <p className="section-label">Assessment Builder</p>
        <h1 className="mt-1 text-2xl sm:text-3xl font-semibold text-slate-900">
          Configure Technical Assessment
        </h1>
        <p className="mt-1.5 text-sm text-slate-600 max-w-3xl">
          Define your target subject, skill calibration, question format, and test rules.
          Questions are generated dynamically and validated before starting the session.
        </p>
      </div>

      {capabilities && !capabilities.aiConfigured && (
        <div
          role="status"
          className="mb-6 rounded-lg border border-amber-300 bg-amber-50/80 p-4 flex items-start gap-3"
        >
          <AlertTriangle
            aria-hidden="true"
            className="h-5 w-5 text-amber-700 shrink-0 mt-0.5"
          />
          <div className="text-xs sm:text-sm text-amber-950 space-y-1">
            <p className="font-semibold">
              AI Provider Credentials Not Configured on Server
            </p>
            <p className="text-amber-900 leading-relaxed">
              To generate live AI assessments, set{' '}
              <code className="font-mono bg-amber-100 px-1 py-0.5 rounded">AI_PROVIDER</code>,{' '}
              <code className="font-mono bg-amber-100 px-1 py-0.5 rounded">AI_API_KEY</code>, and{' '}
              <code className="font-mono bg-amber-100 px-1 py-0.5 rounded">AI_MODEL</code> in{' '}
              <code className="font-mono bg-amber-100 px-1 py-0.5 rounded">server/.env</code> and
              restart the backend server. CodeAssess AI never substitutes canned or fake questions.
            </p>
          </div>
        </div>
      )}

      {generationError && (
        <div className="mb-6">
          <ErrorState
            title="Assessment Generation Failed"
            message={generationError.message}
            code={generationError.code}
            details={generationError.details}
            onRetry={submitGeneration}
            retryLabel="Retry Generation"
          />
        </div>
      )}

      <form
        onSubmit={handleFormSubmit}
        noValidate
        className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
      >
        {/* Main Configuration Controls */}
        <div className="lg:col-span-8 space-y-8">
          {/* 1. Subject & Programming Language */}
          <section className="surface-panel p-5 sm:p-6 space-y-5">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                1. Subject & Language Scope
              </h2>
              <p className="mt-0.5 text-xs text-slate-600">
                Choose the primary domain for your assessment.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Subject"
                required
                value={form.subject}
                onChange={(e) => handleSubjectChange(e.target.value)}
                options={SUBJECT_CATALOG.map((s) => ({
                  value: s.name,
                  label: `${s.name} (${s.category})`,
                }))}
                error={fieldErrors.subject}
              />

              {showLanguageSelect && (
                <Select
                  label="Programming Language"
                  required={
                    subjectMeta.languageMode === 'required' ||
                    form.assessmentType === 'Coding Questions' ||
                    form.assessmentType === 'Debugging Questions'
                  }
                  placeholder={
                    subjectMeta.languageMode === 'optional'
                      ? 'Language-agnostic / Conceptual'
                      : undefined
                  }
                  value={form.programmingLanguage}
                  onChange={(e) => {
                    setForm((prev) => ({
                      ...prev,
                      programmingLanguage: e.target.value,
                    }));
                    setFieldErrors((prev) => ({ ...prev, programmingLanguage: undefined }));
                  }}
                  options={subjectMeta.supportedLanguages}
                  helperText={
                    subjectMeta.languageMode === 'optional'
                      ? 'Required if coding or debugging questions are selected.'
                      : 'Used for code snippets, starter templates, and syntax.'
                  }
                  error={fieldErrors.programmingLanguage}
                />
              )}

              {subjectMeta && subjectMeta.languageMode === 'fixed' && (
                <div className="flex flex-col justify-end">
                  <div className="rounded-md border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-700">
                    <span className="block font-medium text-slate-900">
                      Target Language: {subjectMeta.defaultLanguage}
                    </span>
                    <span className="text-slate-500">
                      Automatically bound to the selected subject.
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Topic Selection */}
            {subjectMeta && (
              <div className="pt-2 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-slate-800">
                    Focus Topics within {subjectMeta.name}{' '}
                    <span className="text-xs font-normal text-slate-500">
                      (optional — leave unselected for comprehensive coverage)
                    </span>
                  </span>
                  {form.selectedTopics.length > 0 && (
                    <button
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({ ...prev, selectedTopics: [] }))
                      }
                      className="text-xs text-slate-500 hover:text-slate-800 underline"
                    >
                      Clear ({form.selectedTopics.length})
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {subjectMeta.topics.map((topic) => {
                    const selected = form.selectedTopics.includes(topic);
                    return (
                      <button
                        key={topic}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => toggleTopic(topic)}
                        className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                          selected
                            ? 'border-blue-600 bg-blue-50 text-blue-900'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        {topic}
                      </button>
                    );
                  })}
                </div>

                {/* Custom topic tag input */}
                <div className="flex items-center gap-2 max-w-md pt-1">
                  <Input
                    aria-label="Add custom topic"
                    value={customTopicInput}
                    onChange={(e) => setCustomTopicInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomTopic();
                      }
                    }}
                    placeholder="Add custom focus topic..."
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    onClick={handleAddCustomTopic}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add
                  </Button>
                </div>

                {form.selectedTopics.some((t) => !subjectMeta.topics.includes(t)) && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {form.selectedTopics
                      .filter((t) => !subjectMeta.topics.includes(t))
                      .map((customTopic) => (
                        <span
                          key={customTopic}
                          className="inline-flex items-center gap-1 rounded border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-900"
                        >
                          {customTopic}
                          <button
                            type="button"
                            aria-label={`Remove ${customTopic}`}
                            onClick={() => toggleTopic(customTopic)}
                            className="text-blue-700 hover:text-blue-950"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                  </div>
                )}
              </div>
            )}
          </section>

          {/* 2. Skill Level */}
          <section className="surface-panel p-5 sm:p-6 space-y-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                2. Current Skill Level
              </h2>
              <p className="mt-0.5 text-xs text-slate-600">
                Question complexity, edge cases, and expected depth are calibrated to your chosen level.
              </p>
            </div>

            <RadioGroup
              name="skillLevel"
              value={form.skillLevel}
              onChange={(val) =>
                setForm((prev) => ({ ...prev, skillLevel: val }))
              }
              error={fieldErrors.skillLevel}
              options={SKILL_LEVELS.map((lvl) => ({
                value: lvl.name,
                label: lvl.name,
                badge: `Level ${lvl.rank}/7`,
                description: lvl.description,
              }))}
            />
          </section>

          {/* 3. Assessment Format, Count, and Duration */}
          <section className="surface-panel p-5 sm:p-6 space-y-6">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                3. Format, Length & Timing
              </h2>
              <p className="mt-0.5 text-xs text-slate-600">
                Configure question format, volume, and time limit.
              </p>
            </div>

            <RadioGroup
              name="assessmentType"
              label="Assessment Type"
              columns={2}
              value={form.assessmentType}
              onChange={(val) => {
                setForm((prev) => ({ ...prev, assessmentType: val }));
                setFieldErrors((prev) => ({ ...prev, assessmentType: undefined }));
              }}
              error={fieldErrors.assessmentType}
              options={ASSESSMENT_TYPES.map((typeItem) => ({
                value: typeItem.value,
                label: typeItem.label,
                description: typeItem.description,
                disabled:
                  typeItem.requiresCodeSupport &&
                  subjectMeta &&
                  !subjectMeta.supportsCodeQuestions,
              }))}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2 border-t border-slate-100">
              {/* Question Count */}
              <div className="space-y-2.5">
                <span className="block text-sm font-medium text-slate-800">
                  Question Count
                </span>
                <div className="flex flex-wrap gap-2">
                  {QUESTION_COUNT_PRESETS.map((count) => {
                    const active = form.questionCountMode === String(count);
                    return (
                      <button
                        key={count}
                        type="button"
                        onClick={() => {
                          setForm((prev) => ({
                            ...prev,
                            questionCountMode: String(count),
                            questionCount: count,
                          }));
                          setFieldErrors((prev) => ({ ...prev, questionCount: undefined }));
                        }}
                        className={`rounded-md border px-3 py-1.5 text-xs font-mono font-semibold cursor-pointer ${
                          active
                            ? 'border-slate-900 bg-slate-900 text-white'
                            : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {count}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({ ...prev, questionCountMode: 'custom' }))
                    }
                    className={`rounded-md border px-3 py-1.5 text-xs font-medium cursor-pointer ${
                      form.questionCountMode === 'custom'
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    Custom count
                  </button>
                </div>

                {form.questionCountMode === 'custom' && (
                  <Input
                    type="number"
                    min={1}
                    max={25}
                    value={form.questionCount}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        questionCount: e.target.value,
                      }))
                    }
                    helperText="Enter between 1 and 25 questions."
                    error={fieldErrors.questionCount}
                  />
                )}
                {form.questionCountMode !== 'custom' && fieldErrors.questionCount && (
                  <p className="text-xs text-rose-700 font-medium">
                    {fieldErrors.questionCount}
                  </p>
                )}
              </div>

              {/* Assessment Duration */}
              <div className="space-y-2.5">
                <span className="block text-sm font-medium text-slate-800">
                  Assessment Duration
                </span>
                <div className="flex flex-wrap gap-2">
                  {DURATION_PRESETS.map((mins) => {
                    const active = form.durationMode === String(mins);
                    return (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => {
                          setForm((prev) => ({
                            ...prev,
                            durationMode: String(mins),
                            durationMinutes: mins,
                          }));
                          setFieldErrors((prev) => ({ ...prev, durationMinutes: undefined }));
                        }}
                        className={`rounded-md border px-3 py-1.5 text-xs font-mono font-semibold cursor-pointer ${
                          active
                            ? 'border-slate-900 bg-slate-900 text-white'
                            : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {mins}m
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({ ...prev, durationMode: 'custom' }))
                    }
                    className={`rounded-md border px-3 py-1.5 text-xs font-medium cursor-pointer ${
                      form.durationMode === 'custom'
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    Custom duration
                  </button>
                </div>

                {form.durationMode === 'custom' && (
                  <Input
                    type="number"
                    min={5}
                    max={180}
                    value={form.durationMinutes}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        durationMinutes: e.target.value,
                      }))
                    }
                    helperText="Enter duration in minutes (5 to 180)."
                    error={fieldErrors.durationMinutes}
                  />
                )}
                {form.durationMode !== 'custom' && fieldErrors.durationMinutes && (
                  <p className="text-xs text-rose-700 font-medium">
                    {fieldErrors.durationMinutes}
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* 4. Additional Configuration */}
          <section className="surface-panel p-5 sm:p-6 space-y-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                4. Additional Preferences
              </h2>
              <p className="mt-0.5 text-xs text-slate-600">
                Customize scoring rules, timer enforcement, and learning aids.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Checkbox
                label="Include explanations"
                description="Generate step-by-step technical explanations shown after submission."
                checked={form.includeExplanations}
                onChange={(checked) =>
                  setForm((prev) => ({ ...prev, includeExplanations: checked }))
                }
              />
              <Checkbox
                label="Include hints"
                description="Provide optional directional hints that can be revealed during the test."
                checked={form.includeHints}
                onChange={(checked) =>
                  setForm((prev) => ({ ...prev, includeHints: checked }))
                }
              />
              <Checkbox
                label="Enable countdown timer"
                description="Track remaining time and auto-submit when the duration expires."
                checked={form.enableTimer}
                onChange={(checked) =>
                  setForm((prev) => ({ ...prev, enableTimer: checked }))
                }
              />
              <Checkbox
                label="Enable negative marking"
                description="Deduct 25% of question marks for incorrect multiple-choice selections."
                checked={form.enableNegativeMarking}
                onChange={(checked) =>
                  setForm((prev) => ({ ...prev, enableNegativeMarking: checked }))
                }
              />
              <Checkbox
                label="Randomize question order"
                description="Shuffle generated questions before starting the test session."
                checked={form.randomizeQuestions}
                onChange={(checked) =>
                  setForm((prev) => ({ ...prev, randomizeQuestions: checked }))
                }
              />
            </div>
          </section>
        </div>

        {/* Sticky Configuration Summary & Action Column */}
        <aside className="lg:col-span-4 lg:sticky lg:top-20 space-y-4">
          <div className="surface-panel p-5 space-y-4">
            <div className="border-b border-slate-200 pb-3">
              <h2 className="text-sm font-semibold text-slate-900">
                Assessment Specification
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                {isAuthenticated
                  ? `Signed in as ${user?.name} — attempt will be saved to your history.`
                  : 'Guest mode — results are accessible in this session.'}
              </p>
            </div>

            <dl className="space-y-2.5 text-xs">
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500">Subject</dt>
                <dd className="font-semibold text-slate-900 text-right">
                  {form.subject}
                </dd>
              </div>
              {form.programmingLanguage && (
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500">Language</dt>
                  <dd className="font-mono font-medium text-slate-900">
                    {form.programmingLanguage}
                  </dd>
                </div>
              )}
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500">Skill Level</dt>
                <dd className="font-medium text-slate-900">{form.skillLevel}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500">Format</dt>
                <dd className="font-medium text-slate-900 text-right">
                  {form.assessmentType}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500">Questions</dt>
                <dd className="font-mono font-semibold text-slate-900">
                  {form.questionCount}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500">Duration</dt>
                <dd className="font-mono font-semibold text-slate-900">
                  {form.enableTimer ? `${form.durationMinutes} min` : 'Untimed'}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500">Negative Marking</dt>
                <dd className="font-medium text-slate-900">
                  {form.enableNegativeMarking ? 'Enabled (-25%)' : 'Disabled'}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500">Focus Topics</dt>
                <dd className="font-medium text-slate-900 text-right">
                  {form.selectedTopics.length > 0
                    ? `${form.selectedTopics.length} selected`
                    : 'All core topics'}
                </dd>
              </div>
            </dl>

            <div className="pt-2 space-y-2.5">
              <Button
                type="submit"
                variant="accent"
                size="lg"
                loading={generating}
                className="w-full"
              >
                <Sparkles className="h-4 w-4" />
                {generating ? 'Generating Assessment...' : 'Generate Assessment'}
                {!generating && <ArrowRight className="h-4 w-4" />}
              </Button>

              {generating && (
                <div className="rounded-md border border-blue-200 bg-blue-50/70 p-3 text-xs text-blue-950 space-y-2">
                  <p className="leading-relaxed">
                    Synthesizing {form.questionCount} calibrated questions for{' '}
                    <span className="font-semibold">{form.subject}</span> and validating JSON schema...
                  </p>
                  <button
                    type="button"
                    onClick={() => abortRef.current?.abort()}
                    className="font-medium text-blue-800 underline hover:text-blue-950"
                  >
                    Cancel request
                  </button>
                </div>
              )}
            </div>

            {!isAuthenticated && (
              <p className="border-t border-slate-200 pt-3 text-xs text-slate-500 leading-relaxed">
                Want long-term progress analytics?{' '}
                <Link
                  to="/login?redirect=/configure"
                  className="font-medium text-blue-600 hover:text-blue-800 underline"
                >
                  Log in
                </Link>{' '}
                before generating.
              </p>
            )}
          </div>
        </aside>
      </form>
    </div>
  );
}
