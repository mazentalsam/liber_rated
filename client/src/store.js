// Per-device memory. Storage can throw in private mode; the app works without it.
const read = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback } catch { return fallback }
}
const write = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* not remembered */ }
}

export const loadNeeds = () => read('liberrated.needs', [])
export const saveNeeds = needs => write('liberrated.needs', needs)
export const loadRequested = () => read('liberrated.requested', [])
export const saveRequested = list => write('liberrated.requested', list)
