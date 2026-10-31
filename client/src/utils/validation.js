import { findSubjectConfig } from './assessmentCatalog.js';

export function validateAssessmentConfiguration(form) {
  const errors = {};
  const subjectConfig = findSubjectConfig(form.subject);

  if (!subjectConfig) {
    errors.subject = 'Select a subject to assess.';
  }

  if (!form.skillLevel) {
    errors.skillLevel = 'Select your current skill level.';
  }

  if (!form.assessmentType) {
    errors.assessmentType = 'Select an assessment format.';
  } else if (
    subjectConfig &&
    !subjectConfig.supportsCodeQuestions &&
    (form.assessmentType === 'Coding Questions' ||
      form.assessmentType === 'Debugging Questions')
  ) {
    errors.assessmentType = `${form.assessmentType} cannot be used with ${form.subject}. Select Multiple Choice Questions, Conceptual Questions, or Mixed Assessment.`;
  }

  if (subjectConfig) {
    if (subjectConfig.languageMode === 'required' && !form.programmingLanguage) {
      errors.programmingLanguage = `Select a programming language for ${form.subject}.`;
    }
    if (
      subjectConfig.languageMode === 'optional' &&
      !form.programmingLanguage &&
      (form.assessmentType === 'Coding Questions' ||
        form.assessmentType === 'Debugging Questions')
    ) {
      errors.programmingLanguage =
        'Select a programming language when generating coding or debugging questions.';
    }
  }

  const count = Number.parseInt(form.questionCount, 10);
  if (!Number.isFinite(count) || count < 1 || count > 25) {
    errors.questionCount = 'Enter a question count between 1 and 25.';
  }

  const duration = Number.parseInt(form.durationMinutes, 10);
  if (!Number.isFinite(duration) || duration < 5 || duration > 180) {
    errors.durationMinutes = 'Enter a duration between 5 and 180 minutes.';
  }

  return errors;
}

export function validateRegistrationForm({ name, email, password, confirmPassword }) {
  const errors = {};
  const trimmedName = String(name || '').trim();
  const trimmedEmail = String(email || '').trim();

  if (trimmedName.length < 2 || trimmedName.length > 80) {
    errors.name = 'Enter your full name (2 to 80 characters).';
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    errors.email = 'Enter a valid email address.';
  }
  if (!password || password.length < 8) {
    errors.password = 'Password must be at least 8 characters long.';
  } else if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    errors.password = 'Password must include at least one letter and one number.';
  }
  if (password !== confirmPassword) {
    errors.confirmPassword = 'Passwords do not match.';
  }

  return errors;
}

export function validateLoginForm({ email, password }) {
  const errors = {};
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim())) {
    errors.email = 'Enter a valid email address.';
  }
  if (!password) {
    errors.password = 'Enter your password.';
  }
  return errors;
}
