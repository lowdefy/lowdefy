/*
  Copyright 2020-2026 Lowdefy, Inc

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

// Dev-only feedback overlay support: keeps a rolling buffer of recent console
// output so a feedback batch can carry "what was happening in the console"
// context without the developer having to paste it in manually. The patch is
// installed once at import time and guarded on the console object itself so
// repeated imports (or HMR re-evaluation) never double-wrap the methods.

const MAX_ENTRIES = 30;
const MAX_TEXT_LENGTH = 500;

const entries = [];

function stringifyArg(arg) {
  try {
    if (typeof arg === 'string') {
      return arg;
    }
    if (arg instanceof Error) {
      return arg.stack ?? arg.message ?? String(arg);
    }
    return JSON.stringify(arg);
  } catch {
    try {
      return String(arg);
    } catch {
      return '[unserializable]';
    }
  }
}

function formatArgs(args) {
  try {
    const text = Array.from(args).map(stringifyArg).join(' ');
    return text.length > MAX_TEXT_LENGTH ? `${text.slice(0, MAX_TEXT_LENGTH)}…` : text;
  } catch {
    return '[unformattable console arguments]';
  }
}

function record(level, args) {
  try {
    entries.push({ level, text: formatArgs(args), timestamp: new Date().toISOString() });
    if (entries.length > MAX_ENTRIES) {
      entries.shift();
    }
  } catch {
    // Buffering must never break the original console call.
  }
}

function patchMethod(level) {
  const original = console[level];
  if (typeof original !== 'function') {
    return;
  }
  // eslint-disable-next-line no-console
  console[level] = function patchedConsoleMethod(...args) {
    record(level, args);
    original.apply(console, args);
  };
}

if (typeof console !== 'undefined' && !console.__lowdefyFeedbackPatched) {
  console.__lowdefyFeedbackPatched = true;
  ['error', 'warn', 'info', 'log'].forEach(patchMethod);
}

function getConsoleEntries() {
  return entries.slice();
}

export { getConsoleEntries };
