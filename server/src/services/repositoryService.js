import fs from 'node:fs';
import path from 'node:path';
import mongoose from 'mongoose';
import { getEnv } from '../config/env.js';
import { getDatabaseStatus } from '../config/db.js';
import { User } from '../models/User.js';
import { Assessment } from '../models/Assessment.js';
import { AssessmentAttempt } from '../models/AssessmentAttempt.js';
import { AppError } from '../utils/AppError.js';

function ensureMongoConnected() {
  const status = getDatabaseStatus();
  if (!status.connected) {
    throw new AppError(
      `Database connection is unavailable (${status.lastError || 'MongoDB disconnected'}). Verify MONGODB_URI in server/.env and ensure MongoDB is running.`,
      503,
      'DATABASE_UNAVAILABLE'
    );
  }
}

function isValidObjectId(id) {
  return typeof id === 'string' && mongoose.Types.ObjectId.isValid(id);
}

function readLocalStore() {
  const { localDbFile } = getEnv();
  try {
    if (!fs.existsSync(localDbFile)) {
      return { users: [], assessments: [], attempts: [] };
    }
    const raw = fs.readFileSync(localDbFile, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      users: Array.isArray(parsed.users) ? parsed.users : [],
      assessments: Array.isArray(parsed.assessments) ? parsed.assessments : [],
      attempts: Array.isArray(parsed.attempts) ? parsed.attempts : [],
    };
  } catch {
    return { users: [], assessments: [], attempts: [] };
  }
}

function writeLocalStore(store) {
  const { localDbFile } = getEnv();
  const dir = path.dirname(localDbFile);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const tmpFile = `${localDbFile}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(store, null, 2), 'utf8');
  fs.renameSync(tmpFile, localDbFile);
}

function sanitizeUserRecord(record, includePasswordHash = false) {
  if (!record) return null;
  const plain = typeof record.toObject === 'function' ? record.toObject() : { ...record };
  const result = {
    id: String(plain._id || plain.id),
    _id: String(plain._id || plain.id),
    name: plain.name,
    email: plain.email,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
  if (includePasswordHash) {
    result.passwordHash = plain.passwordHash;
  }
  return result;
}

function normalizeDoc(record) {
  if (!record) return null;
  const plain = typeof record.toJSON === 'function' ? record.toJSON() : { ...record };
  plain.id = String(plain._id || plain.id);
  plain._id = String(plain._id || plain.id);
  if (plain.user) plain.user = String(plain.user);
  if (plain.assessment && typeof plain.assessment !== 'object') {
    plain.assessment = String(plain.assessment);
  }
  return plain;
}

export const repository = {
  // ---- Users ----
  async findUserByEmail(email, { includePasswordHash = false } = {}) {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const env = getEnv();

    if (env.dbMode === 'local_json') {
      const store = readLocalStore();
      const found = store.users.find((u) => u.email === normalizedEmail) || null;
      return sanitizeUserRecord(found, includePasswordHash);
    }

    ensureMongoConnected();
    const query = User.findOne({ email: normalizedEmail });
    if (includePasswordHash) {
      query.select('+passwordHash');
    }
    const doc = await query.exec();
    return sanitizeUserRecord(doc, includePasswordHash);
  },

  async findUserById(userId) {
    if (!isValidObjectId(userId)) return null;
    const env = getEnv();

    if (env.dbMode === 'local_json') {
      const store = readLocalStore();
      const found = store.users.find((u) => String(u._id) === String(userId)) || null;
      return sanitizeUserRecord(found, false);
    }

    ensureMongoConnected();
    const doc = await User.findById(userId).exec();
    return sanitizeUserRecord(doc, false);
  },

  async createUser({ name, email, passwordHash }) {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const env = getEnv();

    if (env.dbMode === 'local_json') {
      const store = readLocalStore();
      if (store.users.some((u) => u.email === normalizedEmail)) {
        throw new AppError('An account with this email address already exists.', 409, 'EMAIL_EXISTS');
      }
      const now = new Date().toISOString();
      const doc = new User({ name, email: normalizedEmail, passwordHash });
      await doc.validate();

      const raw = doc.toObject();
      const stored = {
        ...raw,
        _id: String(raw._id),
        passwordHash,
        createdAt: now,
        updatedAt: now,
      };
      store.users.push(stored);
      writeLocalStore(store);
      return sanitizeUserRecord(stored, false);
    }

    ensureMongoConnected();
    try {
      const created = await User.create({
        name,
        email: normalizedEmail,
        passwordHash,
      });
      return sanitizeUserRecord(created, false);
    } catch (error) {
      if (error?.code === 11000) {
        throw new AppError('An account with this email address already exists.', 409, 'EMAIL_EXISTS');
      }
      throw error;
    }
  },

  // ---- Assessments ----
  async createAssessment(payload) {
    const env = getEnv();

    if (env.dbMode === 'local_json') {
      const doc = new Assessment(payload);
      await doc.validate();

      const now = new Date().toISOString();
      const raw = doc.toObject();
      const stored = {
        ...raw,
        _id: String(raw._id),
        user: raw.user ? String(raw.user) : null,
        createdAt: now,
        updatedAt: now,
      };
      const store = readLocalStore();
      store.assessments.push(stored);
      writeLocalStore(store);
      return normalizeDoc(stored);
    }

    ensureMongoConnected();
    const created = await Assessment.create(payload);
    return normalizeDoc(created);
  },

  async findAssessmentById(assessmentId) {
    if (!isValidObjectId(assessmentId)) return null;
    const env = getEnv();

    if (env.dbMode === 'local_json') {
      const store = readLocalStore();
      const found = store.assessments.find((a) => String(a._id) === String(assessmentId)) || null;
      return normalizeDoc(found);
    }

    ensureMongoConnected();
    const doc = await Assessment.findById(assessmentId).exec();
    return normalizeDoc(doc);
  },

  // ---- Assessment Attempts ----
  async findAttemptBySubmissionKey(assessmentId, submissionKey) {
    if (!submissionKey || !isValidObjectId(assessmentId)) return null;
    const env = getEnv();

    if (env.dbMode === 'local_json') {
      const store = readLocalStore();
      const found =
        store.attempts.find(
          (att) =>
            String(att.assessment) === String(assessmentId) &&
            att.submissionKey === submissionKey
        ) || null;
      return normalizeDoc(found);
    }

    ensureMongoConnected();
    const doc = await AssessmentAttempt.findOne({
      assessment: assessmentId,
      submissionKey,
    }).exec();
    return normalizeDoc(doc);
  },

  async createAttempt(payload) {
    const env = getEnv();

    if (env.dbMode === 'local_json') {
      const doc = new AssessmentAttempt(payload);
      await doc.validate();

      const now = new Date().toISOString();
      const raw = doc.toObject();
      const stored = {
        ...raw,
        _id: String(raw._id),
        user: raw.user ? String(raw.user) : null,
        assessment: String(raw.assessment),
        createdAt: now,
        updatedAt: now,
      };
      const store = readLocalStore();
      store.attempts.push(stored);
      writeLocalStore(store);
      return normalizeDoc(stored);
    }

    ensureMongoConnected();
    const created = await AssessmentAttempt.create(payload);
    return normalizeDoc(created);
  },

  async findLatestAttemptForAssessment(assessmentId, { userId = null, guestSessionId = null, attemptId = null } = {}) {
    if (!isValidObjectId(assessmentId)) return null;
    const env = getEnv();

    if (env.dbMode === 'local_json') {
      const store = readLocalStore();
      let candidates = store.attempts.filter(
        (att) => String(att.assessment) === String(assessmentId)
      );
      if (attemptId && isValidObjectId(attemptId)) {
        candidates = candidates.filter((att) => String(att._id) === String(attemptId));
      }
      if (userId) {
        candidates = candidates.filter((att) => String(att.user) === String(userId));
      } else if (guestSessionId) {
        candidates = candidates.filter((att) => att.guestSessionId === guestSessionId);
      }
      candidates.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return normalizeDoc(candidates[0] || null);
    }

    ensureMongoConnected();
    const filter = { assessment: assessmentId };
    if (attemptId && isValidObjectId(attemptId)) {
      filter._id = attemptId;
    }
    if (userId) {
      filter.user = userId;
    } else if (guestSessionId) {
      filter.guestSessionId = guestSessionId;
    }

    const doc = await AssessmentAttempt.findOne(filter).sort({ createdAt: -1 }).exec();
    return normalizeDoc(doc);
  },

  async listUserAttemptsWithAssessments(userId) {
    if (!isValidObjectId(userId)) return [];
    const env = getEnv();

    if (env.dbMode === 'local_json') {
      const store = readLocalStore();
      const assessmentMap = new Map(
        store.assessments.map((a) => [String(a._id), normalizeDoc(a)])
      );
      return store.attempts
        .filter((att) => String(att.user) === String(userId))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .map((att) => {
          const normalized = normalizeDoc(att);
          const assessment = assessmentMap.get(String(att.assessment)) || null;
          return {
            attempt: normalized,
            assessment,
          };
        })
        .filter((item) => item.assessment !== null);
    }

    ensureMongoConnected();
    const docs = await AssessmentAttempt.find({ user: userId })
      .sort({ createdAt: -1 })
      .populate('assessment')
      .exec();

    return docs
      .filter((doc) => doc.assessment)
      .map((doc) => {
        const assessmentObj = normalizeDoc(doc.assessment);
        const attemptObj = normalizeDoc(doc);
        attemptObj.assessment = assessmentObj.id;
        return {
          attempt: attemptObj,
          assessment: assessmentObj,
        };
      });
  },
};
