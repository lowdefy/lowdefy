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

import buildDecisionState from './buildDecisionState.js';
import createSeededPolicy from './createSeededPolicy.js';
import createWalkProgress from './createWalkProgress.js';

const everything = { has: () => true, findIn: () => null };

function click(blockId, text, extra = {}) {
  return {
    kind: 'click',
    target: { blockId, text },
    blockType: 'Button',
    blockIds: [blockId, 'page'],
    label: text,
    ...extra,
  };
}

function observation(candidates, shape = 'aaaa0001') {
  return { pageId: 'tickets', url: '/tickets?id=t-1', shape, candidates };
}

function decisionState({
  candidates,
  progress,
  history = [],
  blockDiff = [],
  knownText = everything,
  shape,
}) {
  return buildDecisionState({
    context: { title: 'Tickets page', body: 'Adds assigning.' },
    pageId: 'tickets',
    role: 'member',
    url: '/tickets?id=t-1&tab=open',
    blockDiff,
    observation: observation(candidates, shape),
    history,
    knownText,
    progress,
    fixtures: {},
  });
}

test('buildDecisionState sends the page, path with query keys only, the block diff and the options as steps', () => {
  const progress = createWalkProgress();
  progress.startWalk();
  const { state, options, optionToStep, truncated } = decisionState({
    progress,
    blockDiff: [
      {
        blockId: 'assign',
        type: 'Button',
        change: 'added',
        label: 'Assign',
        source: 'pages/a.yaml:3',
      },
    ],
    candidates: [
      click('assign', 'Assign'),
      {
        kind: 'select',
        target: { blockId: 'assignee' },
        blockType: 'Selector',
        blockIds: ['assignee'],
        label: 'Assignee',
        options: ['Grace Hopper'],
      },
    ],
  });
  expect(state.page).toEqual({
    pageId: 'tickets',
    role: 'member',
    path: '/tickets',
    queryKeys: ['id', 'tab'],
  });
  expect(state.change).toEqual({ title: 'Tickets page', body: 'Adds assigning.' });
  expect(state.blockDiff).toEqual([
    { blockId: 'assign', type: 'Button', change: 'added', label: 'Assign' },
  ]);
  expect(options).toEqual({
    o0: 'click Button "Assign" (assign) [changed]',
    o1: 'select Selector "Assignee" (assignee): "Grace Hopper"',
  });
  expect(optionToStep.o0.step).toEqual({ click: { blockId: 'assign', text: 'Assign' } });
  expect(optionToStep.o1.step).toEqual({ select: { blockId: 'assignee', value: 'Grace Hopper' } });
  expect(truncated).toEqual(0);
});

test('an action taken from a shape is not offered from it again in the walk, but is from another shape', () => {
  const progress = createWalkProgress();
  progress.startWalk();
  const candidates = [click('save', 'Save'), click('cancel', 'Cancel')];
  progress.record({ shape: 'aaaa0001', candidate: candidates[0] });
  const same = decisionState({ progress, candidates, history: ['click'] });
  expect(Object.values(same.options)).toEqual(['click Button "Cancel" (cancel)']);
  const other = decisionState({ progress, candidates, history: ['click'], shape: 'bbbb0002' });
  expect(Object.keys(other.options)).toHaveLength(2);
});

test('walk 2 takes a different first action from walk 1 and can still take walk 1 actions, marked [tried]', () => {
  const progress = createWalkProgress();
  const seeded = createSeededPolicy({ seed: 0 });
  const candidates = [click('open', 'Open'), click('save', 'Save'), click('help', 'Help')];
  function firstStep() {
    const walkIndex = progress.walkIndex();
    const { optionToStep } = decisionState({ progress, candidates });
    const optionId = seeded.choose({
      optionToStep,
      pageId: 'tickets',
      role: 'member',
      walkIndex,
      stepIndex: 0,
    });
    const { candidate } = optionToStep[optionId];
    progress.record({ shape: 'aaaa0001', candidate });
    return candidate;
  }
  progress.startWalk();
  const walk1First = firstStep();
  progress.startWalk();
  const walk2First = firstStep();
  expect(walk2First).not.toBe(walk1First);
  const walk2Second = decisionState({ progress, candidates, history: ['first'] });
  const tried = Object.entries(walk2Second.options).find(([, text]) => text.endsWith('[tried]'));
  expect(walk2Second.optionToStep[tried[0]].candidate).toBe(walk1First);
});

test('a walk first step skips tried actions while an untried one remains', () => {
  const progress = createWalkProgress();
  const candidates = [click('open', 'Open'), click('save', 'Save')];
  progress.startWalk();
  progress.record({ shape: 'aaaa0001', candidate: candidates[0] });
  progress.startWalk();
  const first = decisionState({ progress, candidates });
  expect(Object.values(first.options)).toEqual(['click Button "Save" (save)']);
  const second = decisionState({ progress, candidates, history: ['click Button "Save" (save)'] });
  expect(Object.values(second.options)).toEqual([
    'click Button "Open" (open) [tried]',
    'click Button "Save" (save)',
  ]);
});

test('more than 255 options keeps changed-block options first and counts the cut', () => {
  const progress = createWalkProgress();
  progress.startWalk();
  const candidates = Array.from({ length: 300 }, (_, index) => click(`b${index}`, `B${index}`));
  const { options, optionToStep, truncated } = decisionState({
    progress,
    candidates,
    blockDiff: [{ blockId: 'b299', type: 'Button', change: 'changed', label: 'B299' }],
  });
  expect(Object.keys(options)).toHaveLength(255);
  expect(truncated).toEqual(45);
  expect(optionToStep.o0.candidate.target.blockId).toEqual('b299');
  expect(optionToStep.o1.candidate.target.blockId).toEqual('b0');
});

test('createSeededPolicy picks the same options for the same seed and inputs, and others for another seed', () => {
  const candidates = Array.from({ length: 12 }, (_, index) => click(`b${index}`, `B${index}`));
  function walk(seed) {
    const progress = createWalkProgress();
    const policy = createSeededPolicy({ seed });
    const picks = [];
    for (let walkIndex = 0; walkIndex < 3; walkIndex += 1) {
      progress.startWalk();
      for (let stepIndex = 0; stepIndex < 4; stepIndex += 1) {
        const { optionToStep } = decisionState({
          progress,
          candidates,
          history: stepIndex === 0 ? [] : ['x'],
        });
        const optionId = policy.choose({
          optionToStep,
          pageId: 'tickets',
          role: 'member',
          walkIndex,
          stepIndex,
        });
        const { candidate } = optionToStep[optionId];
        picks.push(candidate.target.blockId);
        progress.record({ shape: 'aaaa0001', candidate });
      }
    }
    return picks;
  }
  expect(walk(7)).toEqual(walk(7));
  expect(walk(7)).not.toEqual(walk(8));
});

test('createSeededPolicy prefers untried actions in changed blocks and rotates fill values by walk', () => {
  const progress = createWalkProgress();
  const walkIndex = progress.startWalk();
  const policy = createSeededPolicy({ seed: 0 });
  const title = {
    kind: 'fill',
    target: { blockId: 'title' },
    blockType: 'TextInput',
    blockIds: ['title'],
    label: 'Title',
    input: { valueType: 'string', required: true },
  };
  const { optionToStep } = decisionState({
    progress,
    candidates: [click('help', 'Help'), title],
    blockDiff: [{ blockId: 'title', type: 'TextInput', change: 'added', label: 'Title' }],
  });
  const first = policy.choose({
    optionToStep,
    pageId: 'tickets',
    role: 'member',
    walkIndex,
    stepIndex: 0,
  });
  expect(optionToStep[first].candidate).toBe(title);
  expect(optionToStep[first].valueName).toEqual('empty');
  const next = policy.choose({
    optionToStep,
    pageId: 'tickets',
    role: 'member',
    walkIndex: 1,
    stepIndex: 0,
  });
  expect(optionToStep[next].valueName).toEqual('example');
});
