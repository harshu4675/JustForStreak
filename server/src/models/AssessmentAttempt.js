import mongoose from 'mongoose';

const testCaseExecutionResultSchema = new mongoose.Schema(
  {
    index: { type: Number, required: true },
    isHidden: { type: Boolean, default: false },
    input: { type: String, default: '' },
    expectedOutput: { type: String, default: '' },
    actualOutput: { type: String, default: '' },
    stderr: { type: String, default: '' },
    passed: { type: Boolean, required: true },
  },
  { _id: false }
);

const evaluatedAnswerSchema = new mongoose.Schema(
  {
    questionId: { type: String, required: true },
    questionType: {
      type: String,
      enum: ['mcq', 'coding', 'debugging', 'conceptual'],
      required: true,
    },
    topic: { type: String, required: true },
    difficulty: { type: String, required: true },
    userResponse: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    issueNotes: {
      type: String,
      default: '',
    },
    evaluationStatus: {
      type: String,
      enum: ['correct', 'partial', 'incorrect', 'unanswered', 'execution_unavailable'],
      required: true,
    },
    marksEarned: { type: Number, required: true },
    maxMarks: { type: Number, required: true },
    negativePenalty: { type: Number, default: 0 },
    feedback: { type: String, default: '' },
    executionAvailable: { type: Boolean, default: false },
    testCasesPassed: { type: Number, default: null },
    testCasesFailed: { type: Number, default: null },
    testCaseResults: { type: [testCaseExecutionResultSchema], default: [] },
  },
  { _id: false }
);

const submittedCodeEntrySchema = new mongoose.Schema(
  {
    questionId: { type: String, required: true },
    language: { type: String, default: '' },
    code: { type: String, default: '' },
    executionAvailable: { type: Boolean, default: false },
  },
  { _id: false }
);

const breakdownItemSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    earnedMarks: { type: Number, required: true },
    maxMarks: { type: Number, required: true },
    percentage: { type: Number, required: true },
    correctCount: { type: Number, required: true },
    questionCount: { type: Number, required: true },
  },
  { _id: false }
);

const assessmentAttemptSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    guestSessionId: {
      type: String,
      default: null,
      index: true,
    },
    assessment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assessment',
      required: true,
      index: true,
    },
    submissionKey: {
      type: String,
      default: null,
      index: true,
    },
    answers: {
      type: [evaluatedAnswerSchema],
      default: [],
    },
    submittedCode: {
      type: [submittedCodeEntrySchema],
      default: [],
    },
    score: {
      type: Number,
      required: true,
    },
    maximumScore: {
      type: Number,
      required: true,
    },
    scorableMaximumScore: {
      type: Number,
      required: true,
    },
    percentage: {
      type: Number,
      required: true,
    },
    correctCount: { type: Number, default: 0 },
    partialCount: { type: Number, default: 0 },
    incorrectCount: { type: Number, default: 0 },
    unansweredCount: { type: Number, default: 0 },
    unexecutedCodingCount: { type: Number, default: 0 },
    negativeMarksDeducted: { type: Number, default: 0 },
    timeTaken: {
      type: Number,
      required: true,
      min: 0,
    },
    topicPerformance: {
      type: [breakdownItemSchema],
      default: [],
    },
    difficultyPerformance: {
      type: [breakdownItemSchema],
      default: [],
    },
    performanceSummary: {
      type: String,
      default: '',
    },
    submissionStatus: {
      type: String,
      enum: ['completed', 'expired_auto_submitted'],
      default: 'completed',
    },
  },
  {
    timestamps: true,
    bufferCommands: false,
  }
);

assessmentAttemptSchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.id = String(ret._id);
    delete ret.__v;
    return ret;
  },
});

export const AssessmentAttempt =
  mongoose.models.AssessmentAttempt ||
  mongoose.model('AssessmentAttempt', assessmentAttemptSchema);
