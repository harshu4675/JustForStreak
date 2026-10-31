import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Code2,
  FileCheck2,
  Layers,
  ShieldCheck,
  SlidersHorizontal,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth.js';
import { Button } from '../components/ui/Button.jsx';
import { Select } from '../components/ui/Select.jsx';
import { SKILL_LEVELS, SUBJECT_CATALOG } from '../utils/assessmentCatalog.js';

const CATEGORIES = [
  'All',
  'Core Programming',
  'Languages & Frameworks',
  'Computer Science',
  'Web Foundations',
  'Data & Backend',
  'Aptitude & Communication',
];

const WORKFLOW_STEPS = [
  {
    step: '01',
    title: 'Define Assessment Scope',
    description:
      'Choose from 16 technical or aptitude subjects, specify a programming language when applicable, select one of 7 skill tiers, and pick specific subtopics.',
  },
  {
    step: '02',
    title: 'Generate Validated Questions',
    description:
      'The backend AI engine builds original multiple-choice, coding, debugging, or conceptual questions and validates the output against a strict JSON schema.',
  },
  {
    step: '03',
    title: 'Attempt in Focused Workspace',
    description:
      'Work through questions with a persistent countdown timer, review flags, keyboard-accessible controls, and a syntax-aware code editor.',
  },
  {
    step: '04',
    title: 'Review Granular Diagnostics',
    description:
      'Inspect score breakdowns by topic and difficulty, read technical explanations for missed questions, and track skill progression over time.',
  },
];

const CAPABILITIES = [
  {
    icon: SlidersHorizontal,
    title: 'Seven-Stage Skill Calibration',
    description:
      'Progress systematically from Absolute Beginner terminology checks through Expert system-level edge cases and algorithmic optimization.',
  },
  {
    icon: Code2,
    title: 'Four Distinct Question Formats',
    description:
      'Combine Multiple Choice, Coding Problems with test specifications, Debugging defective code snippets, and Conceptual written explanations.',
  },
  {
    icon: FileCheck2,
    title: 'Persistent Test State & Timer',
    description:
      'Answers, flagged questions, code drafts, and remaining timer deadlines automatically survive accidental page reloads.',
  },
  {
    icon: ShieldCheck,
    title: 'Transparent Grading & Security',
    description:
      'Reference answers remain server-side until submission. Optional negative marking, rubric feedback, and honest sandbox execution reporting.',
  },
];

export function LandingPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [quickSubject, setQuickSubject] = useState('JavaScript');
  const [quickLevel, setQuickLevel] = useState('Intermediate');
  const [activeCategory, setActiveCategory] = useState('All');

  const selectedQuickLevelObj = useMemo(
    () => SKILL_LEVELS.find((l) => l.name === quickLevel),
    [quickLevel]
  );

  const visibleSubjects = useMemo(() => {
    if (activeCategory === 'All') return SUBJECT_CATALOG;
    return SUBJECT_CATALOG.filter((s) => s.category === activeCategory);
  }, [activeCategory]);

  const handleQuickStart = (event) => {
    event.preventDefault();
    const params = new URLSearchParams({
      subject: quickSubject,
      skillLevel: quickLevel,
    });
    navigate(`/configure?${params.toString()}`);
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 rounded border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-mono font-medium text-slate-700">
                <span>STRUCTURED TECHNICAL EVALUATION</span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900 leading-tight">
                Assess programming knowledge with calibrated, AI-generated coding tests.
              </h1>

              <p className="text-base text-slate-600 leading-relaxed max-w-2xl">
                CodeAssess AI generates custom technical assessments tailored to your exact subject,
                programming language, skill tier, and target topics. Practice in a distraction-free
                environment, review detailed explanations, and measure improvement across attempts.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => navigate('/configure')}
                >
                  Configure Assessment
                  <ArrowRight className="h-4 w-4" />
                </Button>
                {isAuthenticated ? (
                  <Button
                    variant="secondary"
                    size="lg"
                    onClick={() => navigate('/dashboard')}
                  >
                    Open Dashboard
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    size="lg"
                    onClick={() => navigate('/register')}
                  >
                    Create Account to Track History
                  </Button>
                )}
              </div>

              <div className="pt-2 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-600">
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 aria-hidden="true" className="h-3.5 w-3.5 text-emerald-700" />
                  Guest assessment mode available without signup
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 aria-hidden="true" className="h-3.5 w-3.5 text-emerald-700" />
                  MCQ, Coding, Debugging, and Conceptual formats
                </span>
              </div>
            </div>

            {/* Functional Quick-Launch Configuration Panel */}
            <div className="lg:col-span-5">
              <form
                onSubmit={handleQuickStart}
                className="rounded-lg border border-slate-200 bg-slate-50/70 p-5 sm:p-6 space-y-4"
              >
                <div className="border-b border-slate-200 pb-3">
                  <h2 className="text-sm font-semibold text-slate-900">
                    Quick Assessment Setup
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-600">
                    Pre-select a subject and skill tier to open the full configuration builder.
                  </p>
                </div>

                <Select
                  label="Subject"
                  value={quickSubject}
                  onChange={(e) => setQuickSubject(e.target.value)}
                  options={SUBJECT_CATALOG.map((s) => ({
                    value: s.name,
                    label: s.name,
                  }))}
                />

                <Select
                  label="Current Skill Level"
                  value={quickLevel}
                  onChange={(e) => setQuickLevel(e.target.value)}
                  options={SKILL_LEVELS.map((l) => ({
                    value: l.name,
                    label: `${l.rank}. ${l.name}`,
                  }))}
                />

                {selectedQuickLevelObj && (
                  <div className="rounded-md border border-slate-200 bg-white p-3 text-xs text-slate-600 leading-relaxed">
                    <span className="font-semibold text-slate-800">
                      {selectedQuickLevelObj.name}:{' '}
                    </span>
                    {selectedQuickLevelObj.description}
                  </div>
                )}

                <Button type="submit" variant="accent" size="md" className="w-full">
                  Continue to Configuration
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Subjects & Skill Levels Overview */}
      <section id="subjects" className="border-b border-slate-200 py-14 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <p className="section-label">Curriculum Scope</p>
                <h2 className="mt-1 text-2xl font-semibold text-slate-900">
                  Supported Subjects
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-600">
                Select any subject below to configure an assessment directly.
              </p>
            </div>

            <div
              role="tablist"
              aria-label="Filter subjects by category"
              className="flex flex-wrap gap-1.5 pt-1"
            >
              {CATEGORIES.map((category) => {
                const active = activeCategory === category;
                return (
                  <button
                    key={category}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setActiveCategory(category)}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                      active
                        ? 'bg-slate-900 text-white'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {category}
                  </button>
                );
              })}
            </div>

            <div className="surface-panel divide-y divide-slate-200">
              {visibleSubjects.map((subj) => (
                <div
                  key={subj.name}
                  className="p-4 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold text-slate-900">
                        {subj.name}
                      </h3>
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                        {subj.category}
                      </span>
                      {subj.supportedLanguages.length > 1 && (
                        <span className="font-mono text-[11px] text-slate-500">
                          {subj.supportedLanguages.join(' / ')}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-slate-600">{subj.summary}</p>
                  </div>

                  <Link
                    to={`/configure?subject=${encodeURIComponent(subj.name)}`}
                    className="shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800"
                  >
                    Assess {subj.name}
                    <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* 7-Level Progression */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Layers aria-hidden="true" className="h-4 w-4 text-slate-600" />
              <h2 className="text-xl font-semibold text-slate-900">
                Seven-Level Difficulty Progression
              </h2>
            </div>

            <div className="surface-panel divide-y divide-slate-200">
              {SKILL_LEVELS.map((level) => (
                <div
                  key={level.name}
                  className="p-4 sm:px-5 grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 items-baseline"
                >
                  <div className="md:col-span-3 flex items-center gap-2.5">
                    <span className="font-mono text-xs font-semibold text-slate-400">
                      L{level.rank}
                    </span>
                    <span className="text-sm font-semibold text-slate-900">
                      {level.name}
                    </span>
                  </div>
                  <p className="md:col-span-7 text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {level.description}
                  </p>
                  <div className="md:col-span-2 md:text-right">
                    <Link
                      to={`/configure?skillLevel=${encodeURIComponent(level.name)}`}
                      className="text-xs font-medium text-slate-700 hover:text-blue-600 underline underline-offset-2"
                    >
                      Select level
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section id="workflow" className="border-b border-slate-200 bg-white py-14 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="section-label">Assessment Process</p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-900">
              How CodeAssess AI Works
            </h2>
          </div>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-t border-slate-200">
            {WORKFLOW_STEPS.map((item, idx) => (
              <div
                key={item.step}
                className={`pt-6 pb-4 ${
                  idx > 0 ? 'lg:pl-6 lg:border-l lg:border-slate-200' : ''
                } ${idx < WORKFLOW_STEPS.length - 1 ? 'lg:pr-6' : ''}`}
              >
                <span className="font-mono text-xs font-semibold text-blue-600">
                  STEP {item.step}
                </span>
                <h3 className="mt-2 text-base font-semibold text-slate-900">
                  {item.title}
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-14 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="section-label">Platform Architecture</p>
              <h2 className="mt-1 text-2xl font-semibold text-slate-900">
                Built for Deliberate Practice and Verification
              </h2>
            </div>
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate('/configure')}
            >
              <BookOpen className="h-4 w-4" />
              Build an Assessment
            </Button>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            {CAPABILITIES.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="flex items-start gap-4 border-t border-slate-200 pt-5"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-800">
                  <Icon aria-hidden="true" className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
                  <p className="mt-1 text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
