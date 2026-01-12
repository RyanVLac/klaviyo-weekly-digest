const KEY = "kwd_active_email";

export function getActiveEmail(): string {
  if (typeof window === "undefined") return "";
  return (localStorage.getItem(KEY) ?? "").trim();
}

export function setActiveEmail(email: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, email.trim());
}

export function clearActiveEmail() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}
