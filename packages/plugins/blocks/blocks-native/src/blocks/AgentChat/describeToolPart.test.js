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

import describeToolPart from './describeToolPart.js';

const translate = (key, values) => (values ? `${key} ${JSON.stringify(values)}` : key);

test('describeToolPart names a running call and sums up what it was called with', () => {
  const description = describeToolPart({
    part: {
      type: 'tool-search_designs',
      toolCallId: 'c1',
      state: 'input-available',
      input: { q: 'payroll', space: 'ACME', limit: 5 },
    },
    translate,
  });
  expect(description).toMatchObject({
    id: 'c1',
    status: 'running',
    summary: '“payroll” · “ACME”',
    title: 'Search designs',
    icon: { symbol: 'magnifyingglass', fallback: 'Search' },
    detail: null,
  });
});

test('describeToolPart says a running call is running when its input is hidden', () => {
  const description = describeToolPart({
    config: { showToolInputStreaming: false },
    part: { type: 'tool-search', toolCallId: 'c1', state: 'input-streaming', input: { q: 'pay' } },
    translate,
  });
  expect(description.summary).toEqual('agent.toolResult.running');
});

test('describeToolPart sums up a finished call and opens to its output as readable rows', () => {
  const description = describeToolPart({
    part: {
      type: 'tool-get',
      toolCallId: 'c1',
      state: 'output-available',
      input: {},
      output: { key: 'ACME-1', done: true },
    },
    translate,
  });
  expect(description.status).toEqual('done');
  expect(description.summary).toEqual('agent.toolResult.returnedKeys {"keys":"key, done"}');
  expect(description.detail).toEqual({
    kind: 'rows',
    rows: [
      { depth: 0, kind: 'text', label: 'Key', text: 'ACME-1' },
      { depth: 0, kind: 'text', label: 'Done', text: 'Yes' },
    ],
  });
});

test('describeToolPart shows a markdown display and a sub-agent answer as markdown', () => {
  const display = describeToolPart({
    part: {
      type: 'tool-report',
      toolCallId: 'c1',
      state: 'output-available',
      output: { display: '# Report\n\nAll good.' },
    },
    translate,
  });
  expect(display.summary).toEqual('# Report All good.');
  expect(display.detail).toEqual({ kind: 'markdown', text: '# Report\n\nAll good.' });
  const subAgent = describeToolPart({
    part: {
      type: 'dynamic-tool',
      toolName: 'ask_scoper',
      toolCallId: 'c2',
      state: 'output-available',
      output: { _subAgent: true, text: 'Scoped.' },
    },
    translate,
  });
  expect(subAgent).toMatchObject({
    detail: { kind: 'markdown', text: 'Scoped.' },
    icon: { symbol: 'sparkles' },
    summary: 'agent.toolResult.completed',
    title: 'Ask scoper',
  });
});

test('describeToolPart follows toolResultDisplay, per tool name with a default', () => {
  const part = { type: 'tool-list', toolCallId: 'c1', state: 'output-available', output: [1, 2] };
  const config = { toolResultDisplay: { list: 'full', default: 'none' } };
  expect(describeToolPart({ config, part, translate }).detail).toEqual({
    kind: 'json',
    text: '[\n  1,\n  2\n]',
  });
  expect(
    describeToolPart({ config, part: { ...part, type: 'tool-get' }, translate }).detail
  ).toBeNull();
});

test('describeToolPart marks a call waiting for approval, failed or rejected', () => {
  expect(
    describeToolPart({
      part: {
        type: 'tool-write_task',
        toolCallId: 'c1',
        state: 'approval-requested',
        approval: { id: 'ap1' },
        input: { title: 'Fix' },
      },
      translate,
    })
  ).toMatchObject({
    approvalId: 'ap1',
    status: 'approval',
    summary: 'agent.toolResult.waitingApproval',
  });
  expect(
    describeToolPart({
      part: { type: 'tool-get', toolCallId: 'c1', state: 'output-error', errorText: 'Not found.' },
      translate,
    })
  ).toMatchObject({ status: 'error', summary: 'Not found.' });
  expect(
    describeToolPart({
      part: { type: 'tool-get', toolCallId: 'c1', state: 'output-error' },
      translate,
    }).summary
  ).toEqual('agent.toolResult.failed');
  expect(
    describeToolPart({
      part: { type: 'tool-get', toolCallId: 'c1', state: 'output-denied' },
      translate,
    })
  ).toMatchObject({ status: 'denied', summary: 'agent.toolResult.rejected' });
});
