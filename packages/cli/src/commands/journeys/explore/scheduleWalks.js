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

import createWalkProgress from './createWalkProgress.js';

const DROP_REASONS = ['refused', 'access-changed'];
const RUN_STOP_REASONS = ['budget', 'cost'];

function targetKey(target) {
  return `${target.pageId}\u0000${target.user ?? ''}`;
}

// Runs the walks breadth-first: round r walks every target once, in order,
// before round r + 1 starts, so every target gets its first walk before any
// gets a second. A target the head config refuses (refused, access changed)
// is dropped. The run stops when shouldStop() says budget or cost (the walk
// in flight finishes its step and closes), or when a walk finds the dev
// server restarted under a changed build (buildChanged()); after a restart
// on the same build, the walk is retried once. afterWalk(log) runs after each
// walk (confirmation replays run there and count against the budget).
// runOne({ target, walkId, walkIndex, progress }) runs one walk and returns
// its log; a walk that throws (the policy's model failing three times in a
// row, a step the dev server refused) stops the run with reason error, and
// the walks before it are kept. Returns { logs, notRun: [{ pageId, user,
// reason }], stopped }.
async function scheduleWalks({
  targets,
  walks,
  runOne,
  shouldStop,
  buildChanged,
  afterWalk = async () => {},
}) {
  const progressByTarget = new Map(
    targets.map((target) => [targetKey(target), createWalkProgress()])
  );
  const dropped = new Map();
  const logs = [];
  const notRun = [];
  let walkCount = 0;
  let stopped = null;

  async function walkOnce({ target, walkIndex }) {
    walkCount += 1;
    return runOne({
      target,
      walkId: `walk-${walkCount}`,
      walkIndex,
      progress: progressByTarget.get(targetKey(target)),
    });
  }

  for (let walkIndex = 0; walkIndex < walks && stopped === null; walkIndex += 1) {
    for (const target of targets) {
      if (dropped.has(targetKey(target))) continue;
      const stop = shouldStop();
      if (stop !== null) {
        stopped = { reason: stop };
        break;
      }
      let log;
      try {
        log = await walkOnce({ target, walkIndex });
        if (log.stopReason === 'server-restarted') {
          logs.push(log);
          if (await buildChanged()) {
            stopped = {
              reason: 'server-restarted',
              message:
                'The dev server restarted on a changed build, so the head changed under the run.',
            };
            break;
          }
          log = await walkOnce({ target, walkIndex });
        }
        logs.push(log);
        await afterWalk(log);
      } catch (error) {
        stopped = { reason: 'error', message: error.message };
        break;
      }
      if (DROP_REASONS.includes(log.stopReason)) {
        dropped.set(targetKey(target), log.stopReason);
      }
      if (RUN_STOP_REASONS.includes(log.stopReason)) {
        stopped = { reason: log.stopReason };
        break;
      }
    }
  }

  targets.forEach((target) => {
    const walked = logs.filter(
      (log) => log.pageId === target.pageId && log.user === target.user
    ).length;
    if (dropped.has(targetKey(target))) {
      notRun.push({
        pageId: target.pageId,
        user: target.user,
        reason: dropped.get(targetKey(target)),
      });
    } else if (walked < walks && stopped !== null) {
      notRun.push({
        pageId: target.pageId,
        user: target.user,
        reason: stopped.reason,
        walks: walks - walked,
      });
    }
  });
  return { logs, notRun, stopped };
}

export default scheduleWalks;
