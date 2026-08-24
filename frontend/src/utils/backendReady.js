import { API_BASE_URL } from "../api/client";

const PER_ATTEMPT_TIMEOUT_MS = 5000;
const MAX_TOTAL_WAIT_MS = 100000; // comfortably covers a Render free-tier cold start (~60-90s observed)
const BACKOFF_STEPS_MS = [1000, 2000, 3000, 5000]; // then holds at 5000 between further attempts

/**
 * Polls GET /health until the backend responds, retrying with backoff.
 *
 * Exists specifically to ride out a cold-started backend (e.g. Render's
 * free tier, which spins the service down after ~15 minutes idle and can
 * take 60-90s to wake on the next request) without the app ever showing a
 * hard connection error on a normal page load — see AppContext.jsx, which
 * calls this before attempting any real data fetch.
 *
 * Resolves `true` once /health responds OK, or `false` if MAX_TOTAL_WAIT_MS
 * elapses without success (a genuine outage, not just a cold start).
 */
export async function waitForBackendReady({ onAttempt } = {}) {
  const startedAt = Date.now();
  let attempt = 0;

  while (Date.now() - startedAt < MAX_TOTAL_WAIT_MS) {
    attempt += 1;
    onAttempt?.(attempt, Date.now() - startedAt);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), PER_ATTEMPT_TIMEOUT_MS);

    try {
      const response = await fetch(`${API_BASE_URL}/health`, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (response.ok) return true;
    } catch {
      clearTimeout(timeoutId);
      // Timed out, network error, or backend not yet listening — fall through and retry.
    }

    const delay = BACKOFF_STEPS_MS[Math.min(attempt - 1, BACKOFF_STEPS_MS.length - 1)];
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  return false;
}
