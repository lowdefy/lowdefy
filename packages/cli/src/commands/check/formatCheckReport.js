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
import path from 'path';

import { type } from '@lowdefy/helpers';

const UNLOCATED = '(unlocated)';

// source is "<file>:<line>" when the location resolved to a line, or just
// "<file>" when it did not.
function splitSource({ source, configDirectory }) {
  if (type.isNone(source)) {
    return { file: UNLOCATED, line: '' };
  }
  const match = /^(.*):(\d+)$/.exec(source);
  const file = match === null ? source : match[1];
  const line = match === null ? '' : match[2];
  return { file: relativeToConfig({ file, configDirectory }), line };
}

// Sources are absolute; files inside the app read better relative to it.
function relativeToConfig({ file, configDirectory }) {
  if (type.isNone(configDirectory)) {
    return file;
  }
  const relative = path.relative(configDirectory, file);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    return file;
  }
  return relative;
}

function formatEntry({ entry, line }) {
  const slug = type.isNone(entry.checkSlug) ? '' : ` (${entry.checkSlug})`;
  return `  ${line.padStart(4)}  ${entry.name}: ${entry.message}${slug}`;
}

function groupBySource({ entries, configDirectory }) {
  const groups = new Map();
  entries.forEach((entry) => {
    const { file, line } = splitSource({ source: entry.source, configDirectory });
    if (!groups.has(file)) {
      groups.set(file, []);
    }
    groups.get(file).push({ entry, line });
  });
  return groups;
}

function compareFiles(a, b) {
  // Unlocated entries go last so the located ones read like compiler output.
  if (a === UNLOCATED) return 1;
  if (b === UNLOCATED) return -1;
  return a.localeCompare(b);
}

function pluralize(count, noun) {
  return `${count} ${noun}${count === 1 ? '' : 's'}`;
}

function formatGroups({ entries, configDirectory }) {
  const groups = groupBySource({ entries, configDirectory });
  const lines = [];
  [...groups.keys()].sort(compareFiles).forEach((file) => {
    lines.push(file);
    groups
      .get(file)
      .sort((a, b) => Number(a.line) - Number(b.line))
      .forEach((item) => lines.push(formatEntry(item)));
    lines.push('');
  });
  return lines;
}

// The merge report answers a different question from the config report - what
// this branch collides with, not what is wrong with it - so it reads as its own
// section rather than mixed into the files.
function formatAgainst({ against, configDirectory }) {
  if (type.isNone(against)) {
    return [];
  }
  const entries = [...against.errors, ...against.warnings];
  if (entries.length === 0) {
    return [];
  }
  return [`Merge against ${against.ref}`, '', ...formatGroups({ entries, configDirectory })];
}

function formatCheckReport({ against, errors, warnings, configDirectory }) {
  const lines = formatGroups({ entries: [...errors, ...warnings], configDirectory });
  lines.push(...formatAgainst({ against, configDirectory }));
  const errorCount = errors.length + (against?.errors ?? []).length;
  const warningCount = warnings.length + (against?.warnings ?? []).length;
  if (errorCount === 0 && warningCount === 0) {
    lines.push('No problems found.');
  } else {
    lines.push(`${pluralize(errorCount, 'error')}, ${pluralize(warningCount, 'warning')}`);
  }
  return lines.join('\n');
}

export default formatCheckReport;
