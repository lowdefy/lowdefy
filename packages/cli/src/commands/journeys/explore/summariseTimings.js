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

function mean(values) {
  if (values.length === 0) return null;
  return Math.round(values.reduce((total, value) => total + value, 0) / values.length);
}

function p90(values) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * 0.9) - 1)];
}

// Seconds per step (mean and p90 of the whole step, and the means of act +
// settle, observe and decide) and per walk outside its steps (mean, with data
// load, page open and close), from the walk logs, in milliseconds.
function summariseTimings({ logs }) {
  const steps = logs.flatMap((log) => log.steps);
  const totals = steps.map(
    ({ durations }) => durations.decideMs + durations.actMs + durations.observeMs
  );
  const opened = logs.filter((log) => typeof log.open?.ms === 'number');
  return {
    step: {
      meanMs: mean(totals),
      p90Ms: p90(totals),
      actMs: mean(steps.map(({ durations }) => durations.actMs)),
      observeMs: mean(steps.map(({ durations }) => durations.observeMs)),
      decideMs: mean(steps.map(({ durations }) => durations.decideMs)),
    },
    walk: {
      meanMs: mean(opened.map((log) => log.open.ms + (log.closeMs ?? 0))),
      dataMs: mean(opened.map((log) => log.open.dataMs ?? 0)),
      openMs: mean(opened.map((log) => log.open.pageMs ?? log.open.ms)),
      closeMs: mean(opened.map((log) => log.closeMs ?? 0)),
    },
  };
}

export default summariseTimings;
