export function getPreferredLanguage() {
  const deviceLanguage = navigator.language || navigator.languages?.[0] || "";

  return deviceLanguage.toLowerCase().startsWith("ru") ? "ru" : "en";
}

export function getPreferredTheme() {
  if (typeof window.matchMedia !== "function") {
    return 0;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? 1 : 0;
}
