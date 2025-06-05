export function isUnauthorizedError(error: any): boolean {
  return error.message === "Unauthorized" || error.message === "Not authenticated";
}

export function handleUnauthorizedError() {
  window.location.href = "/login";
} 