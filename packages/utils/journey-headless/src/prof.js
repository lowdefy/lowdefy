// LDF-1164 scratch profiling: never merge.
import { performance } from 'node:perf_hooks';

function rec() {
  return globalThis.__ldfProf;
}
function add(name, ms, count = 1) {
  const r = rec();
  if (!r) return;
  r.t[name] = (r.t[name] ?? 0) + ms;
  r.c[name] = (r.c[name] ?? 0) + count;
}
function timeSync(name, fn) {
  const s = performance.now();
  try {
    return fn();
  } finally {
    add(name, performance.now() - s);
  }
}
async function timeAsync(name, fn) {
  const s = performance.now();
  try {
    return await fn();
  } finally {
    add(name, performance.now() - s);
  }
}
export { add, rec, timeAsync, timeSync };
