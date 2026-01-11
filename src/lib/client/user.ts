const KEY = "kwd_email";

export function getSavedEmail(): string | null {
  if (typeof window === "undefined") return null;
  const v = window.localStorage.getItem(KEY);
  if (!v) return null;
  const email = v.trim().toLowerCase();
  return email ? email : null;
}

export function saveEmail(email: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, email.trim().toLowerCase());
}

export function clearEmail() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}
