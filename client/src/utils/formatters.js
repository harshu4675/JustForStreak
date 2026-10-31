export function formatCountdown(totalSeconds) {
  const safe = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;

  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');

  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${mm}:${ss}`;
  }
  return `${mm}:${ss}`;
}

export function formatDurationReadable(totalSeconds) {
  const safe = Math.max(0, Math.round(Number(totalSeconds) || 0));
  if (safe < 60) {
    return `${safe}s`;
  }
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  if (mins < 60) {
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  }
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  return `${hrs}h ${remMins}m`;
}

export function formatDateTime(isoString) {
  if (!isoString) return 'N/A';
  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(isoString));
  } catch {
    return String(isoString);
  }
}

export function formatQuestionTypeLabel(type) {
  const labels = {
    mcq: 'Multiple Choice',
    coding: 'Coding Problem',
    debugging: 'Debugging',
    conceptual: 'Conceptual',
  };
  return labels[type] || 'Question';
}

export function formatEvaluationStatusLabel(status) {
  const labels = {
    correct: 'Correct',
    partial: 'Partially Correct',
    incorrect: 'Incorrect',
    unanswered: 'Unanswered',
    execution_unavailable: 'Submitted (Execution Unavailable)',
  };
  return labels[status] || 'Evaluated';
}
