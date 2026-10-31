import mongoose from 'mongoose';
import { ASSESSMENT_TYPES, SKILL_LEVEL_NAMES, SUBJECT_NAMES } from '../utils/catalog.js';

const optionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, trim: true },
    text: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const codingTestCaseSchema = new mongoose.Schema(
  {
    input: { type: String, default: '' },
    expectedOutput: { type: String, required: true },
    isHidden: { type: Boolean, default: false },
  },
  { _id: false }
);

const questionSchema = new mongoose.Schema(
  {
    questionId: { type: String, required: true },
    order: { type: Number, required: true },
    type: {
      type: String,
      enum: ['mcq', 'coding', 'debugging', 'conceptual'],
      required: true,
    },
    difficulty: {
      type: String,
      enum: SKILL_LEVEL_NAMES,
      required: true,
    },
    topic: {
      type: String,
      required: true,
      trim: true,
    },
    marks: {
      type: Number,
      required: true,
      min: 1,
      max: 50,
    },
    questionText: {
      type: String,
      required: true,
      trim: true,
    },
    hint: {
      type: String,
      default: '',
    },
    explanation: {
      type: String,
      default: '',
    },

    // Multiple-choice fields
    options: {
      type: [optionSchema],
      default: [],
    },
    allowMultiple: {
      type: Boolean,
      default: false,
    },
    correctAnswer: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    // Coding fields
    problemStatement: { type: String, default: '' },
    inputFormat: { type: String, default: '' },
    outputFormat: { type: String, default: '' },
    constraints: { type: [String], default: [] },
    exampleInput: { type: String, default: '' },
    exampleOutput: { type: String, default: '' },
    starterCode: { type: String, default: '' },
    referenceSolution: { type: String, default: '' },
    testCases: {
      type: [codingTestCaseSchema],
      default: [],
    },

    // Debugging fields
    buggyCode: { type: String, default: '' },
    identifiedIssue: { type: String, default: '' },
    expectedBehavior: { type: String, default: '' },
    correctedSolution: { type: String, default: '' },

    // Conceptual fields
    expectedKeyPoints: { type: [String], default: [] },
    sampleAnswer: { type: String, default: '' },
  },
  { _id: false }
);

const assessmentSchema = new mongoose.Schema(
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
    title: {
      type: String,
      required: true,
      trim: true,
    },
    subject: {
      type: String,
      enum: SUBJECT_NAMES,
      required: true,
      index: true,
    },
    programmingLanguage: {
      type: String,
      default: '',
      trim: true,
    },
    skillLevel: {
      type: String,
      enum: SKILL_LEVEL_NAMES,
      required: true,
    },
    instructions: {
      type: [String],
      default: [],
    },
    duration: {
      type: Number,
      required: true,
      min: 5,
      max: 180,
    },
    totalMarks: {
      type: Number,
      required: true,
      min: 1,
    },
    configuration: {
      assessmentType: {
        type: String,
        enum: ASSESSMENT_TYPES,
        required: true,
      },
      questionCount: {
        type: Number,
        required: true,
        min: 1,
        max: 30,
      },
      durationMinutes: {
        type: Number,
        required: true,
        min: 5,
        max: 180,
      },
      includeExplanations: { type: Boolean, default: true },
      includeHints: { type: Boolean, default: false },
      enableNegativeMarking: { type: Boolean, default: false },
      negativeMarkRatio: { type: Number, default: 0.25 },
      enableTimer: { type: Boolean, default: true },
      randomizeQuestions: { type: Boolean, default: false },
      selectedTopics: { type: [String], default: [] },
    },
    questions: {
      type: [questionSchema],
      required: true,
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: 'Assessment must contain at least one question.',
      },
    },
  },
  {
    timestamps: true,
    bufferCommands: false,
  }
);

assessmentSchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.id = String(ret._id);
    delete ret.__v;
    return ret;
  },
});

export const Assessment =
  mongoose.models.Assessment || mongoose.model('Assessment', assessmentSchema);
