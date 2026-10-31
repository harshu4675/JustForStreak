import { after, before, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import request from 'supertest';

const tempDbFile = path.join(os.tmpdir(), `codeassess_test_${ process.pid }.json`);
process.env.NODE_ENV = 'test';
process.env.DB_MODE = 'local_json';
process.env.LOCAL_DB_FILE = tempDbFile;
process.env.JWT_SECRET = 'test_secret_key_for_codeassess_ai_verification_12345';

const { createApp } = await import('../src/app.js');
const { connectDatabase } = await import('../src/config/db.js');
const { setAiTransportForTesting } = await import('../src/services/aiService.js');
const { setCodeExecutionTransportForTesting } = await import(
  '../src/services/codeExecutionService.js'
);

const app = createApp();

function buildSampleMixedAiPayload() {
  return JSON.stringify({
    title: 'JavaScript Intermediate Technical Assessment',
    instructions: [
      'Complete all four questions within the allotted duration.',
      'Code solutions should handle boundary inputs cleanly.',
    ],
    questions: [
      {
        type: 'mcq',
        difficulty: 'Intermediate',
        topic: 'Asynchronous JS, Promises, and Event Loop',
        marks: 2,
        questionText: 'In what order do microtasks and macrotasks execute after the current synchronous call stack clears in JavaScript?',
        hint: 'Consider Promise callbacks relative to setTimeout.',
        explanation: 'All queued microtasks (such as Promise reactions) drain completely before the event loop processes the next macrotask.',
        options: [
          { id: 'A', text: 'One macrotask runs before all microtasks.' },
          { id: 'B', text: 'All queued microtasks execute before the next macrotask runs.' },
          { id: 'C', text: 'Microtasks and macrotasks alternate one by one.' },
          { id: 'D', text: 'setTimeout(..., 0) always runs before Promise.resolve().then(...).' },
        ],
        allowMultiple: false,
        correctAnswer: 'B',
      },
      {
        type: 'coding',
        difficulty: 'Intermediate',
        topic: 'Arrays and Higher-Order Methods',
        marks: 10,
        questionText: 'Write a program that reads space-separated integers from stdin and prints the sum of all even numbers.',
        problemStatement: 'Given a single line of space-separated integers, output the sum of the even integers.',
        inputFormat: 'A single line containing space-separated integers.',
        outputFormat: 'A single integer representing the sum of even numbers.',
        constraints: ['1 <= count <= 10^4', '-10^6 <= value <= 10^6'],
        exampleInput: '1 2 3 4 6',
        exampleOutput: '12',
        starterCode: 'const fs = require("fs");\n// Write your solution here\n',
        referenceSolution:
          'const fs = require("fs");\nconst nums = fs.readFileSync(0, "utf8").trim().split(/\\s+/).map(Number);\nconsole.log(nums.filter(n => n % 2 === 0).reduce((a, b) => a + b, 0));',
        explanation: 'Filter integers divisible by 2 and accumulate their sum with initial value 0.',
        hint: 'Use modulo 2 check and handle negative even numbers accurately.',
        testCases: [
          { input: '1 2 3 4 6', expectedOutput: '12', isHidden: false },
          { input: '1 3 5', expectedOutput: '0', isHidden: true },
        ],
      },
      {
        type: 'debugging',
        difficulty: 'Intermediate',
        topic: 'Variables, Hoisting, and Closures',
        marks: 4,
        questionText: 'Fix the closure bug in the counter factory below so each invocation increments independently.',
        buggyCode: 'function createCounter() {\n  let count = 0;\n  return function() {\n    count = 0;\n    return ++count;\n  };\n}',
        identifiedIssue: 'count is reset to 0 inside the inner function on every call.',
        expectedBehavior: 'Each call to the returned function should return 1, 2, 3, and so on.',
        correctedSolution: 'function createCounter() {\n  let count = 0;\n  return function() {\n    return ++count;\n  };\n}',
        explanation: 'Removing the reassignment inside the inner closure preserves state across invocations.',
        hint: 'Inspect where count is re-assigned on each call.',
      },
      {
        type: 'conceptual',
        difficulty: 'Intermediate',
        topic: 'Objects, Prototypes, and Classes',
        marks: 4,
        questionText: 'Explain how prototypal delegation resolves property lookups on JavaScript objects.',
        expectedKeyPoints: [
          'Checks own properties on the target object first',
          'Traverses up the prototype chain via [[Prototype]]',
          'Returns undefined if null prototype is reached without match',
        ],
        sampleAnswer:
          'JavaScript first checks whether the property exists as an own property on the object itself. If not found, it traverses [[Prototype]] links up the prototype chain until found or until reaching null, returning undefined.',
        explanation: 'Property access walks the [[Prototype]] chain dynamically until Object.prototype -> null.',
        hint: 'Trace what happens from the instance up to null.',
      },
    ],
  });
}

describe('CodeAssess AI Backend API Suite', () => {
  before(async () => {
    await connectDatabase();
  });

  beforeEach(() => {
    setAiTransportForTesting(null);
    setCodeExecutionTransportForTesting(null);
    delete process.env.AI_API_KEY;
    delete process.env.CODE_EXECUTION_URL;
  });

  after(() => {
    if (fs.existsSync(tempDbFile)) {
      fs.unlinkSync(tempDbFile);
    }
  });

  it('returns health and catalog metadata with capability flags', async () => {
    const healthRes = await request(app).get('/api/health');
    assert.equal(healthRes.status, 200);
    assert.equal(healthRes.body.success, true);
    assert.equal(healthRes.body.data.database.connected, true);
    assert.equal(healthRes.body.data.capabilities.aiConfigured, false);

    const metaRes = await request(app).get('/api/assessments/meta');
    assert.equal(metaRes.status, 200);
    assert.equal(metaRes.body.data.subjects.length, 16);
    assert.equal(metaRes.body.data.skillLevels.length, 7);
  });

  it('registers, logs in, fetches current user without passwordHash, and rejects bad credentials', async () => {
    const agent = request.agent(app);

    const badReg = await agent.post('/api/auth/register').send({
      name: 'A',
      email: 'not-an-email',
      password: 'short',
    });
    assert.equal(badReg.status, 400);
    assert.equal(badReg.body.error.code, 'VALIDATION_ERROR');

    const regRes = await agent.post('/api/auth/register').send({
      name: 'Aarav Sharma',
      email: 'aarav@example.com',
      password: 'Password123',
    });
    assert.equal(regRes.status, 201);
    assert.equal(regRes.body.data.user.email, 'aarav@example.com');
    assert.equal('passwordHash' in regRes.body.data.user, false);

    const meRes = await agent.get('/api/auth/me');
    assert.equal(meRes.status, 200);
    assert.equal(meRes.body.data.user.name, 'Aarav Sharma');

    const wrongLogin = await request(app).post('/api/auth/login').send({
      email: 'aarav@example.com',
      password: 'WrongPassword999',
    });
    assert.equal(wrongLogin.status, 401);

    await agent.post('/api/auth/logout');
    const afterLogout = await agent.get('/api/auth/me');
    assert.equal(afterLogout.status, 401);
  });

  it('returns clear 503 AI_NOT_CONFIGURED when AI_API_KEY is missing instead of returning fake questions', async () => {
    const res = await request(app).post('/api/assessments/generate').send({
      subject: 'JavaScript',
      skillLevel: 'Intermediate',
      assessmentType: 'Multiple Choice Questions',
      questionCount: 5,
      durationMinutes: 15,
    });
    assert.equal(res.status, 503);
    assert.equal(res.body.error.code, 'AI_NOT_CONFIGURED');
  });

  it('validates domain constraints such as rejecting Coding Questions for English Grammar', async () => {
    const res = await request(app).post('/api/assessments/generate').send({
      subject: 'English Grammar',
      skillLevel: 'Beginner',
      assessmentType: 'Coding Questions',
      questionCount: 5,
      durationMinutes: 15,
    });
    assert.equal(res.status, 400);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');
    assert.ok(res.body.error.details.assessmentType);
  });

  it('retries safely when AI returns malformed JSON on first attempt, redacts answers prior to submission, and evaluates guest submission accurately', async () => {
    let callCount = 0;
    setAiTransportForTesting(async ({ userPrompt }) => {
      callCount += 1;
      if (callCount === 1) {
        return '{ malformed json output missing closing braces';
      }
      if (userPrompt.includes('Evaluate the following candidate response')) {
        return JSON.stringify({
          marksEarned: 3.5,
          status: 'partial',
          feedback: 'Accurately described prototype chain lookup; omitted terminal null detail.',
        });
      }
      return buildSampleMixedAiPayload();
    });

    const guestAgent = request.agent(app);
    const genRes = await guestAgent.post('/api/assessments/generate').send({
      subject: 'JavaScript',
      skillLevel: 'Intermediate',
      assessmentType: 'Mixed Assessment',
      questionCount: 4,
      durationMinutes: 30,
      includeExplanations: true,
      includeHints: true,
      enableNegativeMarking: true,
      enableTimer: true,
      randomizeQuestions: false,
      selectedTopics: ['Arrays and Higher-Order Methods'],
    });

    assert.equal(genRes.status, 201);
    assert.equal(callCount, 2);

    const assessment = genRes.body.data.assessment;
    assert.equal(assessment.questions.length, 4);

    // Ensure hidden answers/solutions are stripped before submission
    const mcq = assessment.questions[0];
    assert.equal('correctAnswer' in mcq, false);
    assert.equal('explanation' in mcq, false);
    const coding = assessment.questions[1];
    assert.equal('referenceSolution' in coding, false);
    assert.equal(coding.sampleTestCases.length, 1);

    // Run code when sandbox execution is unconfigured -> honest unconfigured status
    const runRes = await guestAgent
      .post(`/api/assessments/${assessment.id}/run-code`)
      .send({
        questionId: coding.questionId,
        code: 'console.log(12);',
        language: 'JavaScript',
      });
    assert.equal(runRes.status, 200);
    assert.equal(runRes.body.data.executionAvailable, false);
    assert.equal(runRes.body.data.status, 'EXECUTION_SERVICE_UNCONFIGURED');

    // Submit with wrong MCQ (tests negative marking), written coding (unexecuted), exact debugging fix, and conceptual answer
    const submitRes = await guestAgent
      .post(`/api/assessments/${assessment.id}/submit`)
      .send({
        submissionKey: 'unique-submit-1',
        timeTaken: 420,
        answers: {
          q_1: 'A', // wrong -> -0.5 penalty (25% of 2 marks)
          q_2: 'const fs = require("fs"); console.log(12);', // execution_unavailable
          q_3: {
            code: 'function createCounter() {\n  let count = 0;\n  return function() {\n    return ++count;\n  };\n}',
            issueNotes: 'Removed count = 0 reset inside closure',
          },
          q_4: 'JavaScript checks own properties first and then walks up the prototype chain.',
        },
      });

    assert.equal(submitRes.status, 201);
    const result = submitRes.body.data.result;
    // Marks: q_1 = -0.5, q_2 = 0 (unexecuted), q_3 = +4, q_4 = +3.5 => total score = 7.0
    assert.equal(result.score, 7);
    assert.equal(result.negativeMarksDeducted, 0.5);
    assert.equal(result.unexecutedCodingCount, 1);
    assert.equal(result.questionsReview[1].executionAvailable, false);
    assert.equal(result.questionsReview[1].testCasesPassed, null);
    assert.equal(result.questionsReview[0].correctAnswer, 'B');

    // Duplicate submission with same submissionKey returns existing attempt without duplicating
    const dupRes = await guestAgent
      .post(`/api/assessments/${assessment.id}/submit`)
      .send({
        submissionKey: 'unique-submit-1',
        timeTaken: 420,
        answers: {},
      });
    assert.equal(dupRes.status, 200);
    assert.equal(dupRes.body.data.duplicatePrevented, true);
  });

  it('evaluates coding questions with real test case counts when sandboxed execution transport is configured and updates authenticated dashboard', async () => {
    setAiTransportForTesting(async ({ userPrompt }) => {
      if (userPrompt.includes('Evaluate the following candidate response')) {
        return JSON.stringify({
          marksEarned: 4,
          status: 'correct',
          feedback: 'Complete explanation of prototype delegation.',
        });
      }
      return buildSampleMixedAiPayload();
    });

    setCodeExecutionTransportForTesting(async ({ testCases }) => ({
      executionAvailable: true,
      status: 'EXECUTED',
      message: 'Executed in isolated sandbox.',
      passedCount: testCases.length,
      failedCount: 0,
      results: testCases.map((tc, i) => ({
        index: i + 1,
        isHidden: Boolean(tc.isHidden),
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        actualOutput: tc.expectedOutput,
        stderr: '',
        passed: true,
      })),
    }));

    const userAgent = request.agent(app);
    await userAgent.post('/api/auth/login').send({
      email: 'aarav@example.com',
      password: 'Password123',
    });

    const genRes = await userAgent.post('/api/assessments/generate').send({
      subject: 'JavaScript',
      skillLevel: 'Intermediate',
      assessmentType: 'Mixed Assessment',
      questionCount: 4,
      durationMinutes: 30,
    });
    assert.equal(genRes.status, 201);
    const assessmentId = genRes.body.data.assessment.id;

    const submitRes = await userAgent
      .post(`/api/assessments/${assessmentId}/submit`)
      .send({
        timeTaken: 615,
        answers: {
          q_1: 'B',
          q_2: 'const fs = require("fs"); const nums = fs.readFileSync(0,"utf8").trim().split(/\\s+/).map(Number); console.log(nums.filter(n=>n%2===0).reduce((a,b)=>a+b,0));',
          q_3: 'function createCounter() { let count = 0; return function() { return ++count; }; }',
          q_4: 'Checks own property first, then walks [[Prototype]] links until null.',
        },
      });

    assert.equal(submitRes.status, 201);
    assert.equal(submitRes.body.data.result.score, 20);
    assert.equal(submitRes.body.data.result.percentage, 100);
    assert.equal(submitRes.body.data.result.questionsReview[1].testCasesPassed, 2);

    const summaryRes = await userAgent.get('/api/dashboard/summary');
    assert.equal(summaryRes.status, 200);
    assert.equal(summaryRes.body.data.totalAssessmentsCompleted, 1);
    assert.equal(summaryRes.body.data.highestScore, 100);
    assert.equal(
      summaryRes.body.data.recommendedNextAssessment.skillLevel,
      'Upper Intermediate'
    );

    const progressRes = await userAgent.get('/api/dashboard/progress');
    assert.equal(progressRes.status, 200);
    assert.equal(progressRes.body.data.subjectProgress.length, 1);
    assert.equal(progressRes.body.data.subjectProgress[0].subject, 'JavaScript');

    const historyRes = await userAgent.get('/api/assessments/history');
    assert.equal(historyRes.status, 200);
    assert.equal(historyRes.body.data.history.length, 1);
  });
});
