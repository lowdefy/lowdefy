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

import assert from 'node:assert/strict';
import { test } from 'node:test';

import formatReport from './formatReport.mjs';

const MB = 1024 * 1024;

function run({ passesMs, passCount = 1 }) {
  return { passCount, passesMs, peakRssKb: 800 * 1024, totalMs: passesMs + 5000 };
}

function profileSummary({ yaml }) {
  return {
    durationMs: 10000,
    packages: { yaml, '@lowdefy/build': 3000, '(node)': 1000 },
    buildFiles: { 'dist/build/addKeys.js': 1500 },
    runtime: { '(garbage collector)': 800, '(program)': 200, '(idle)': 100 },
  };
}

const report = {
  app: 'packages-docs',
  machine: {
    arch: 'arm64',
    cpuModel: 'Apple M2',
    cpus: 8,
    loadAverage: [2, 1.5, 1],
    node: 'v26.12.1',
    platform: 'darwin',
  },
  sides: [
    { label: 'baseline (3a9370b)', name: 'baseline' },
    { label: 'current (this checkout)', name: 'current' },
  ],
  comparison: {
    identical: true,
    lines: ['Compared a with b.', 'Identical: 1200 files and the build messages.'],
  },
  sizes: {
    baseline: { keyMap: 40 * MB, refMap: 0.5 * MB, build: 51 * MB },
    current: { keyMap: 40 * MB, refMap: 0.5 * MB, build: 51 * MB },
  },
  timing: {
    runs: 3,
    results: {
      baseline: [run({ passesMs: 10000 }), run({ passesMs: 11000 }), run({ passesMs: 12000 })],
      current: [run({ passesMs: 9000 }), run({ passesMs: 9900 }), run({ passesMs: 10500 })],
    },
  },
  profile: {
    baseline: profileSummary({ yaml: 4000 }),
    current: profileSummary({ yaml: 2000 }),
  },
};

test('formatReport puts the output verdict first, then sizes, timing and profile', () => {
  const lines = formatReport({ report }).split('\n');
  const headings = lines.filter((line) => line.startsWith('#'));
  assert.deepEqual(headings, [
    '## Build bench: `packages-docs`',
    '### Sizes',
    '### Timing',
    '### Profile',
  ]);
  assert.ok(
    lines.indexOf('**Output**: Identical: 1200 files and the build messages.') <
      lines.indexOf('### Sizes')
  );
});

test('formatReport shows each timing median with its range and the change', () => {
  const lines = formatReport({ report }).split('\n');
  assert.ok(
    lines.includes(
      '| Config pass, wall time | 11.00 s (10.00 s–12.00 s) | 9.90 s (9.00 s–10.50 s) | -10.0% |'
    )
  );
  assert.ok(lines.includes('| Config passes | 1 | 1 |  |'));
  assert.ok(lines.includes('| `build/keyMap.json` | 40.0 MB | 40.0 MB | +0.0% |'));
});

test('formatReport shows profile time in seconds and as a share of the pass', () => {
  const lines = formatReport({ report }).split('\n');
  assert.ok(lines.includes('| yaml | 4.00 s | 40.0% | 2.00 s | 20.0% |'));
  assert.ok(lines.includes('| dist/build/addKeys.js | 1.50 s | 15.0% | 1.50 s | 15.0% |'));
  assert.ok(lines.includes('| (garbage collector) | 0.80 s | 8.0% | 0.80 s | 8.0% |'));
});

test('formatReport lists the differences when the output is not identical', () => {
  const markdown = formatReport({
    report: {
      ...report,
      comparison: {
        identical: false,
        lines: ['Compared a with b.', 'Differs: build/app.json', 'Not identical: 1 difference.'],
      },
      timing: null,
      profile: null,
    },
  });
  assert.ok(
    markdown.includes(
      '**Output**: Not identical: 1 difference.\n\n```\nDiffers: build/app.json\n```'
    )
  );
  assert.ok(!markdown.includes('### Timing'));
});
