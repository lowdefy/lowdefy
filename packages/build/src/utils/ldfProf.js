/* Scratch timers for LDF-1167. Never merge. Writes one JSON line per timed call to LDF_PROF_FILE. */
import fs from 'node:fs';
import { performance } from 'node:perf_hooks';

const file = process.env.LDF_PROF_FILE;

function record(name, start) {
  if (!file) return;
  const ms = performance.now() - start;
  fs.appendFileSync(
    file,
    JSON.stringify({ pid: process.pid, name, ms: Math.round(ms * 10) / 10, at: Date.now() }) + '\n'
  );
}

async function ldfTime(name, fn) {
  const start = performance.now();
  try {
    return await fn();
  } finally {
    record(name, start);
  }
}

function ldfTimeSync(name, fn) {
  const start = performance.now();
  try {
    return fn();
  } finally {
    record(name, start);
  }
}

export { ldfTime, ldfTimeSync, record as ldfRecord };
