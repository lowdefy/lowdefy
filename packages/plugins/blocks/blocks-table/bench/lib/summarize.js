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

function percentile(sorted, p) {
  if (!sorted.length) return null;
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[index];
}

function round(value) {
  return value === null ? null : Math.round(value * 100) / 100;
}

// Frame-time summary: percentiles of rAF deltas, frames over 1.5 frame budgets, and fps.
function summarize({ frames, longTasks = [] }) {
  const sorted = [...frames].sort((a, b) => a - b);
  const total = frames.reduce((sum, frame) => sum + frame, 0);
  return {
    frames: frames.length,
    p50: round(percentile(sorted, 50)),
    p95: round(percentile(sorted, 95)),
    p99: round(percentile(sorted, 99)),
    max: round(sorted[sorted.length - 1] ?? null),
    fps: round(total > 0 ? (frames.length * 1000) / total : null),
    over25ms: frames.filter((frame) => frame > 25).length,
    longTasks: longTasks.length,
    longTaskMs: round(longTasks.reduce((sum, duration) => sum + duration, 0)),
  };
}

export default summarize;
