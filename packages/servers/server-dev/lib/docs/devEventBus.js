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

import path from 'node:path';

import chokidar from 'chokidar';
import { type } from '@lowdefy/helpers';

import getStaleStatus from './getStaleStatus.js';
import readBuildArtifact from './readBuildArtifact.js';

// In-process publish/subscribe bus behind the dev server's push channels
// (MCP notifications/message and GET /lowdefy-docs/events). Deliberately
// unbuffered: a subscriber that missed an event polls build_status, which is
// derived from the same build/buildStatus.json this bus watches, so the two
// always agree. Event shape is { type, timestamp, ...entry } with type one of
// build | client_error | server_error | dev_notice | restart | fixture_seeded.
const EVENT_TYPES = [
  'build',
  'client_error',
  'server_error',
  'dev_notice',
  'restart',
  'fixture_seeded',
  'migrations',
];

// A build that fails on a whole config directory produces hundreds of entries,
// and publish never awaits a send - a stalled SSE client would queue every one
// of them. The full lists stay one build_status poll away, which is the stated
// contract for this bus.
const MAX_EVENT_ENTRIES = 20;

function capEntries(entries) {
  if (entries.length <= MAX_EVENT_ENTRIES) {
    return entries;
  }
  return entries.slice(0, MAX_EVENT_ENTRIES);
}

// The Hono process boots once per (re)start, so module load time is the
// restart time — subscribers receive it as a restart event on connect.
const bootedAt = new Date().toISOString();

const subscribers = [];

let watcher = null;

function publish(event) {
  if (!EVENT_TYPES.includes(event?.type)) {
    // A bus must not be able to break its producer: publish is called from
    // inside the error stores, which are called from the server's error sink.
    console.error(
      `devEventBus dropped an event: type must be one of ${EVENT_TYPES.join(
        ', '
      )}. Received ${JSON.stringify(event?.type)}.`
    );
    return;
  }
  const fullEvent = { timestamp: new Date().toISOString(), ...event };
  // Iterate over a copy: a failing send unsubscribes itself mid-loop.
  [...subscribers].forEach((send) => {
    let result;
    try {
      result = send(fullEvent);
    } catch {
      unsubscribe(send);
      return;
    }
    if (type.isFunction(result?.then)) {
      result.catch(() => unsubscribe(send));
    }
  });
}

function readBuildEvent() {
  // The manager writes buildStatus.json from another process; a change event
  // can fire while the write is still in flight. A half-written file is not an
  // error worth surfacing — the completed write fires its own change event.
  try {
    const build = readBuildArtifact({ name: 'buildStatus.json' });
    if (type.isNone(build)) return null;
    const errors = build.errors ?? [];
    const warnings = build.warnings ?? [];
    return {
      type: 'build',
      status: build.status,
      errorCount: errors.length,
      warningCount: warnings.length,
      errors: capEntries(errors),
      warnings: capEntries(warnings),
      // The counts above are the whole build; the lists are the first
      // MAX_EVENT_ENTRIES of each. Read build_status for the rest.
      truncated: errors.length > MAX_EVENT_ENTRIES || warnings.length > MAX_EVENT_ENTRIES,
      stale: false,
      staleSince: null,
      ...getStaleStatus(),
    };
  } catch {
    return null;
  }
}

function publishBuildStatus() {
  const event = readBuildEvent();
  if (event === null) return;
  publish(event);
}

// The watcher is held open only while someone is listening. Starting it at
// module load would pin every process that imports an error store — including
// test runners — on a persistent fs handle for a file it may never need.
function startWatcher() {
  watcher = chokidar.watch(path.join(process.cwd(), 'build', 'buildStatus.json'), {
    persistent: true,
    ignoreInitial: true,
  });
  watcher.on('add', publishBuildStatus);
  watcher.on('change', publishBuildStatus);
  // No unlink handler: cleanBuildDirectory removes the file mid-rebuild and the
  // rebuild's own write re-adds it.
}

function stopWatcher() {
  const closing = watcher.close();
  watcher = null;
  return closing;
}

function unsubscribe(send) {
  const index = subscribers.indexOf(send);
  if (index === -1) return;
  subscribers.splice(index, 1);
  if (subscribers.length === 0 && watcher !== null) {
    stopWatcher();
  }
}

function subscribe(send) {
  if (!type.isFunction(send)) {
    throw new Error(
      `devEventBus.subscribe requires a "send" function. Received ${JSON.stringify(send)}.`
    );
  }
  subscribers.push(send);
  if (watcher === null) {
    startWatcher();
  }
  return () => unsubscribe(send);
}

export { bootedAt, publish, subscribe };
