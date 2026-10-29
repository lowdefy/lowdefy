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

import summarizeValues from './summarizeValues.mjs';

const MB = 1024 * 1024;
const TOP_PACKAGES = 15;
const TOP_BUILD_FILES = 20;
const RUNTIME_ENTRIES = ['(garbage collector)', '(program)', '(idle)'];

function formatMegabytes(bytes) {
  const megabytes = bytes / MB;
  return `${megabytes.toFixed(megabytes < 10 ? 2 : 1)} MB`;
}

function formatSeconds(ms) {
  return `${(ms / 1000).toFixed(2)} s`;
}

function formatChange({ baseline, current }) {
  if (baseline === 0) {
    return '';
  }
  const change = ((current - baseline) / baseline) * 100;
  return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
}

function row(cells) {
  return `| ${cells.join(' | ')} |`;
}

function header(cells) {
  return [row(cells), row(cells.map(() => '---'))];
}

function formatVerdict({ comparison }) {
  if (comparison === null) {
    return ['**Output**: not compared (`--no-compare`).'];
  }
  // The first line names the two sides, which the report's heading does.
  const [, ...lines] = comparison.lines;
  if (comparison.identical) {
    return [`**Output**: ${lines.join(' ')}`];
  }
  const verdict = lines[lines.length - 1];
  return [`**Output**: ${verdict}`, '', '```', ...lines.slice(0, -1), '```'];
}

function formatSizes({ sides, sizes }) {
  const [baseline, current] = sides;
  const lines = ['### Sizes', '', ...header(['', baseline.label, current.label, 'change'])];
  [
    ['`build/keyMap.json`', 'keyMap'],
    ['`build/refMap.json`', 'refMap'],
    ['`build/`', 'build'],
  ].forEach(([label, key]) => {
    const values = { baseline: sizes[baseline.name][key], current: sizes[current.name][key] };
    lines.push(
      row([
        label,
        formatMegabytes(values.baseline),
        formatMegabytes(values.current),
        formatChange(values),
      ])
    );
  });
  return lines;
}

function formatSpread({ values, format }) {
  const { median, min, max } = summarizeValues(values);
  return { median, text: `${format(median)} (${format(min)}–${format(max)})` };
}

function formatPassCounts(runs) {
  const counts = [...new Set(runs.map((run) => run.passCount))].sort((a, b) => a - b);
  return counts.join(', ');
}

function formatTiming({ sides, timing }) {
  const [baseline, current] = sides;
  const runs = { baseline: timing.results[baseline.name], current: timing.results[current.name] };
  const lines = [
    '### Timing',
    '',
    `${timing.runs} run${timing.runs === 1 ? '' : 's'} per side after one warm-up each, ` +
      'alternating; median (min–max).',
    '',
    ...header(['', baseline.label, current.label, 'change']),
  ];
  [
    ['Config pass, wall time', (run) => run.passesMs, formatSeconds],
    ['Config pass, CPU time (user + system)', (run) => run.passesCpuMs, formatSeconds],
    ['`lowdefy build`, installs included', (run) => run.totalMs, formatSeconds],
    ['Peak memory, config pass', (run) => run.peakRssKb * 1024, formatMegabytes],
  ].forEach(([label, pick, format]) => {
    const spreads = {
      baseline: formatSpread({ values: runs.baseline.map(pick), format }),
      current: formatSpread({ values: runs.current.map(pick), format }),
    };
    lines.push(
      row([
        label,
        spreads.baseline.text,
        spreads.current.text,
        formatChange({ baseline: spreads.baseline.median, current: spreads.current.median }),
      ])
    );
  });
  lines.push(
    row(['Config passes', formatPassCounts(runs.baseline), formatPassCounts(runs.current), ''])
  );
  return lines;
}

function formatShare({ ms, summary }) {
  if (ms === undefined) {
    return ['–', '–'];
  }
  return [formatSeconds(ms), `${((ms / summary.durationMs) * 100).toFixed(1)}%`];
}

function formatProfileTable({ entries, keys, sides, title, summaries }) {
  const [baseline, current] = sides;
  const lines = [title, '', ...header(['', baseline.label, 'share', current.label, 'share'])];
  keys.forEach((key) => {
    lines.push(
      row([
        key,
        ...formatShare({ ms: summaries.baseline[entries][key], summary: summaries.baseline }),
        ...formatShare({ ms: summaries.current[entries][key], summary: summaries.current }),
      ])
    );
  });
  return lines;
}

// The keys of an entry kind with the most time on either side, most first.
function topKeys({ entries, limit, summaries }) {
  const most = {};
  [summaries.baseline, summaries.current].forEach((summary) => {
    Object.entries(summary[entries]).forEach(([key, ms]) => {
      most[key] = Math.max(most[key] ?? 0, ms);
    });
  });
  return Object.keys(most)
    .sort((a, b) => most[b] - most[a])
    .slice(0, limit);
}

function formatProfile({ profile, sides }) {
  const [baseline, current] = sides;
  const summaries = { baseline: profile[baseline.name], current: profile[current.name] };
  const tableArgs = { sides, summaries };
  return [
    '### Profile',
    '',
    'One more run per side with `--cpu-prof`: self time of the config passes, as a share of ' +
      `their profiled time (${formatSeconds(summaries.baseline.durationMs)} and ` +
      `${formatSeconds(summaries.current.durationMs)}).`,
    '',
    ...formatProfileTable({
      ...tableArgs,
      entries: 'packages',
      keys: topKeys({ entries: 'packages', limit: TOP_PACKAGES, summaries }),
      title: `By package (top ${TOP_PACKAGES})`,
    }),
    '',
    ...formatProfileTable({
      ...tableArgs,
      entries: 'buildFiles',
      keys: topKeys({ entries: 'buildFiles', limit: TOP_BUILD_FILES, summaries }),
      title: `By \`@lowdefy/build\` file (top ${TOP_BUILD_FILES})`,
    }),
    '',
    ...formatProfileTable({
      ...tableArgs,
      entries: 'runtime',
      keys: RUNTIME_ENTRIES,
      title: 'Runtime',
    }),
  ];
}

function formatMachine({ machine }) {
  const load = machine.loadAverage.map((value) => value.toFixed(1)).join(' ');
  return (
    `Node ${machine.node} on ${machine.platform}-${machine.arch}, ${machine.cpuModel} ` +
    `(${machine.cpus} cores), load average ${load} at the start.`
  );
}

// The bench report as markdown, for stdout and a pull request: the output
// verdict first, then sizes, timing and the top of the profile.
function formatReport({ report }) {
  const { comparison, machine, profile, sides, sizes, timing } = report;
  const lines = [
    `## Build bench: \`${report.app}\``,
    '',
    `${sides[0].label} against ${sides[1].label}. ${formatMachine({ machine })}`,
    '',
    ...formatVerdict({ comparison }),
    '',
    ...formatSizes({ sides, sizes }),
  ];
  if (timing !== null) {
    lines.push('', ...formatTiming({ sides, timing }));
  }
  if (profile !== null) {
    lines.push('', ...formatProfile({ profile, sides }));
  }
  return lines.join('\n') + '\n';
}

export default formatReport;
