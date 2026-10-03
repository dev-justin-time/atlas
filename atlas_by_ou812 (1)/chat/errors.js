export function formatChatError(error) {
  const nestedMessage = error?.error?.message || error?.response?.data?.error?.message;
  const message = typeof error === 'string' ? error.trim() : typeof error?.message === 'string' ? error.message.trim() : '';
  const details = [message, nestedMessage, error?.code, error?.type].filter(Boolean).join(' ').toLowerCase();
  const status = Number(error?.status ?? error?.statusCode ?? error?.status_code ?? error?.response?.status);

  if (error?.name === 'AbortError') return 'The request was cancelled. You can try again when ready.';
  if (/content.?policy|moderation|safety filter/.test(details)) {
    return 'I could not process that request as written. Rephrase it and try again.';
  }
  if (status === 401 || status === 403 || /unauthorized|authentication|permission denied|invalid api key/.test(details)) {
    return 'The assistant could not authorize this request. Refresh the page and sign in again if needed.';
  }
  if (status === 429 || /rate.?limit|too many requests|\b429\b/.test(details)) {
    return 'The assistant is receiving too many requests. Wait a moment, then try again.';
  }
  if (status === 408 || status === 504 || /timed? out|timeout/.test(details)) {
    return 'The assistant request timed out. Try a shorter request or retry in a moment.';
  }
  if (status >= 500 || /service unavailable|internal server error|\b5\d{2}\b/.test(details)) {
    return 'The assistant service is temporarily unavailable. Please try again shortly.';
  }
  if (/failed to fetch|network|connection|econnreset/.test(details) || error?.name === 'TypeError') {
    return 'Could not reach the assistant service. Check your connection and try again.';
  }
  if (message === 'The assistant service is unavailable. Please try again shortly.' || message === 'A.T.L.A.S. returned an empty response. Please try again.') return message;
  return 'A.T.L.A.S. could not complete that response. Try again or rephrase the request.';
}
