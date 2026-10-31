/**
 * Extracts and parses a JSON object from raw LLM text output.
 * Handles accidental Markdown code fences without silently inventing data.
 */
export function parseStructuredJson(rawText) {
  if (typeof rawText !== 'string' || !rawText.trim()) {
    throw new Error('AI response body was empty.');
  }

  const trimmed = rawText.trim();

  // Direct parse attempt first
  try {
    return JSON.parse(trimmed);
  } catch {
    // Continue to fenced or balanced object extraction
  }

  // Extract from ```json ... ``` or ``` ... ``` block
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch && fenceMatch[1]) {
    try {
      return JSON.parse(fenceMatch[1].trim());
    } catch {
      // Fall through to object boundary extraction
    }
  }

  // Locate outermost JSON object boundaries
  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    const candidate = trimmed.slice(firstBrace, lastBrace + 1);
    return JSON.parse(candidate);
  }

  throw new Error('Response did not contain a valid JSON object.');
}
