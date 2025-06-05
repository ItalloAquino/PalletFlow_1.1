export function isUnauthorizedError(error: Error): boolean {
  return /^401: .*Unauthorized/.test(error.message);
}

export function handleUnauthorizedError() {
  // Clear any cached auth data
  localStorage.removeItem('auth');
  // Reload the page to trigger re-authentication
  window.location.reload();
}
