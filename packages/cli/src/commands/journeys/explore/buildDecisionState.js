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

import { type } from '@lowdefy/helpers';

import generateFillValues from './generateFillValues.js';

const MAX_CONTEXT_CHARACTERS = 1500;
const MAX_DIFF_BLOCKS = 40;
const MAX_VISIBLE_BLOCKS = 60;
const MAX_HISTORY = 10;
const MAX_OPTIONS = 255;
const MAX_VALUE_CHARACTERS = 40;
const DATA = '<data>';

// Text reaches the model only when it is known text (config, menus,
// default-locale messages, the data set's fixtures and users, values typed
// earlier); anything else may be a snapshot value and is sent as <data>.
function gate({ text, knownText }) {
  if (type.isNone(text)) return null;
  return knownText.has(String(text)) ? String(text) : DATA;
}

function cut(text) {
  if (type.isNone(text)) return null;
  return text.length > MAX_CONTEXT_CHARACTERS ? `${text.slice(0, MAX_CONTEXT_CHARACTERS)}…` : text;
}

function describePath(url) {
  const parsed = new URL(url, 'http://explorer.local');
  return { path: parsed.pathname, queryKeys: [...new Set(parsed.searchParams.keys())].sort() };
}

function describeCandidate({ candidate, knownText }) {
  const label = gate({ text: candidate.label, knownText });
  const parts = [candidate.kind, candidate.blockType ?? 'control'];
  if (label !== null) parts.push(label === DATA ? DATA : `"${label}"`);
  const where = [candidate.target.blockId];
  if (!type.isNone(candidate.target.row)) where.push(`row ${candidate.target.row}`);
  if (!type.isNone(candidate.target.column)) where.push(`column ${candidate.target.column}`);
  parts.push(`(${where.filter((part) => !type.isNone(part)).join(', ')})`);
  return parts.join(' ');
}

function describeValue({ name, value, knownText }) {
  if (name === 'fixture' || name === 'example') {
    const text = String(value);
    if (text.length <= MAX_VALUE_CHARACTERS && (name === 'example' || knownText.has(text))) {
      return `${name} "${text}"`;
    }
  }
  return name;
}

// The options of one candidate: a click is one option, a fill one per
// generated value, a select one per offered label, known-text labels first.
function expandCandidate({ candidate, fixtures, walkIndex, knownText }) {
  const description = describeCandidate({ candidate, knownText });
  if (candidate.kind === 'fill') {
    return generateFillValues({ candidate, fixtures, walkIndex }).map(({ name, value }) => ({
      text: `${description} with: ${describeValue({ name, value, knownText })}`,
      step: { fill: { ...candidate.target, value } },
      valueName: name,
    }));
  }
  if (candidate.kind === 'select') {
    const labels = candidate.options ?? [];
    const known = labels.filter((label) => knownText.has(label));
    const unknown = labels.filter((label) => !knownText.has(label));
    return [
      ...known.map((label) => ({ text: `${description}: "${label}"`, label })),
      ...unknown.map((label, index) => ({ text: `${description}: ${DATA} #${index + 1}`, label })),
    ].map(({ text, label }) => ({
      text,
      step: { select: { ...candidate.target, value: label } },
      valueName: knownText.has(label) ? 'known' : 'data',
    }));
  }
  return [{ text: description, step: { click: candidate.target }, valueName: null }];
}

function changedBlockIds(blockDiff) {
  return new Set(
    (blockDiff ?? [])
      .filter((block) => block.change === 'added' || block.change === 'changed')
      .map((block) => block.blockId)
  );
}

// What a policy reads for one step, and the options it chooses from. The
// state carries the PR text (or commit messages), the page, role and URL path
// with query keys only, the page's block diff, the visible blocks and the
// last ten steps; every label passes the known-text gate and no state value
// or request response is included. Each option maps back to the grammar
// step it runs. Progress rules apply first: an action taken from this shape
// in this walk is not offered, an earlier walk's is marked [tried], and a
// walk's first step is an untried action while one remains. Past 255
// options, options in changed blocks come first, then document order, and
// the cut is counted.
function buildDecisionState({
  context,
  pageId,
  role,
  url,
  blockDiff = [],
  observation,
  history = [],
  knownText,
  progress,
  fixtures,
}) {
  const shape = observation.shape;
  const changed = changedBlockIds(blockDiff);
  const walkIndex = progress.walkIndex();
  let offered = observation.candidates
    .filter((candidate) => !progress.isTaken({ shape, candidate }))
    .map((candidate) => ({
      candidate,
      tried: progress.isTried({ shape, candidate }),
      changed: candidate.blockIds.some((blockId) => changed.has(blockId)),
    }));
  if (history.length === 0 && offered.some((entry) => !entry.tried)) {
    offered = offered.filter((entry) => !entry.tried);
  }

  const expanded = offered.flatMap(({ candidate, tried, changed: inChange }, order) =>
    expandCandidate({ candidate, fixtures, walkIndex, knownText }).map((option) => ({
      ...option,
      text: `${option.text}${inChange ? ' [changed]' : ''}${tried ? ' [tried]' : ''}`,
      candidate,
      tried,
      changed: inChange,
      order,
    }))
  );
  let kept = expanded;
  let truncated = 0;
  if (expanded.length > MAX_OPTIONS) {
    kept = [
      ...expanded.filter((option) => option.changed),
      ...expanded.filter((option) => !option.changed),
    ].slice(0, MAX_OPTIONS);
    truncated = expanded.length - MAX_OPTIONS;
  }

  const options = {};
  const optionToStep = {};
  kept.forEach((option, index) => {
    const id = `o${index}`;
    options[id] = option.text;
    optionToStep[id] = {
      step: option.step,
      candidate: option.candidate,
      valueName: option.valueName,
      tried: option.tried,
      changed: option.changed,
    };
  });

  const visibleBlocks = [];
  const seenBlocks = new Set();
  observation.candidates.forEach((candidate) => {
    const blockId = candidate.target.blockId;
    if (
      type.isNone(blockId) ||
      seenBlocks.has(blockId) ||
      visibleBlocks.length >= MAX_VISIBLE_BLOCKS
    ) {
      return;
    }
    seenBlocks.add(blockId);
    visibleBlocks.push({
      blockId,
      type: candidate.blockType ?? null,
      label: gate({ text: candidate.label, knownText }),
    });
  });

  const state = {
    change: { title: cut(context.title), body: cut(context.body) },
    page: { pageId, role, ...describePath(url) },
    blockDiff: blockDiff.slice(0, MAX_DIFF_BLOCKS).map((block) => ({
      blockId: block.blockId,
      type: block.type,
      change: block.change,
      label: gate({ text: block.label, knownText }),
    })),
    visibleBlocks,
    lastSteps: history.slice(-MAX_HISTORY),
  };
  return { state, options, optionToStep, truncated };
}

export default buildDecisionState;
