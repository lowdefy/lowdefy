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

const LEVELS = ['log', 'info', 'warn', 'error'];

function formatPart(part) {
  if (part instanceof Error) {
    return part.message;
  }
  if (typeof part === 'string') {
    return part;
  }
  try {
    return JSON.stringify(part);
  } catch (error) {
    return String(part);
  }
}

/**
 * The shell's recent console output, for the shake menu's "Show logs": the last `limit` lines,
 * `{ at, level, message }`, oldest first. install() copies every console call into it (the console
 * still prints); it returns the uninstall function.
 *
 * @param {Object} params
 * @param {Object} params.console The console to follow.
 * @param {number} [params.limit]
 */
function createLogBuffer({ console, limit = 200 }) {
  // Replaced, never changed, on each line: a snapshot for useSyncExternalStore.
  let entries = [];
  const listeners = new Set();

  function add({ level, parts }) {
    const entry = { at: new Date(), level, message: parts.map(formatPart).join(' ') };
    entries = [...entries, entry].slice(-limit);
    // A component may log while React renders another: the log view hears of it afterwards.
    setTimeout(() => listeners.forEach((listener) => listener()), 0);
  }

  function install() {
    const originals = {};
    LEVELS.forEach((level) => {
      originals[level] = console[level];
      console[level] = (...parts) => {
        add({ level, parts });
        originals[level].apply(console, parts);
      };
    });
    return () => {
      LEVELS.forEach((level) => {
        console[level] = originals[level];
      });
    };
  }

  function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  return {
    add: (level, ...parts) => add({ level, parts }),
    entries: () => entries,
    install,
    subscribe,
  };
}

export default createLogBuffer;
