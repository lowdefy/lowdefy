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

import getToolIcon from './getToolIcon.js';
import humanizeToolName from './humanizeToolName.js';
import summarizeToolInput from './summarizeToolInput.js';
import summarizeToolOutput from './summarizeToolOutput.js';

const translate = (key, values) => (values ? `${key} ${JSON.stringify(values)}` : key);

test('humanizeToolName reads snake, kebab and camel case, and a module tool by its endpoint', () => {
  expect(humanizeToolName('search_designs')).toEqual('Search designs');
  expect(humanizeToolName('get-space')).toEqual('Get space');
  expect(humanizeToolName('listOpenTasks')).toEqual('List open tasks');
  expect(humanizeToolName('support__file_ticket')).toEqual('File ticket');
  expect(humanizeToolName('')).toEqual('Tool');
  expect(humanizeToolName(undefined)).toEqual('Tool');
});

test('getToolIcon picks a glyph by the verb a tool name starts with', () => {
  expect(getToolIcon({ toolName: 'search_designs' })).toEqual({
    symbol: 'magnifyingglass',
    fallback: 'Search',
  });
  expect(getToolIcon({ toolName: 'getSpace' }).symbol).toEqual('doc.text');
  expect(getToolIcon({ toolName: 'support__write_ticket' }).symbol).toEqual('square.and.pencil');
  expect(getToolIcon({ toolName: 'delete-thread' }).symbol).toEqual('trash');
  expect(getToolIcon({ toolName: 'update-page-state' }).symbol).toEqual('slider.horizontal.3');
  expect(getToolIcon({ toolName: 'design_status' }).symbol).toEqual('wrench.and.screwdriver');
  expect(getToolIcon({ isSubAgent: true, toolName: 'search' }).symbol).toEqual('sparkles');
});

test('summarizeToolInput quotes the first two text or number values', () => {
  expect(
    summarizeToolInput({ input: { q: 'payroll  run', page: 2, space: 'PEL' }, translate })
  ).toEqual('“payroll run” · “2”');
  expect(summarizeToolInput({ input: { q: 'x'.repeat(70) }, translate })).toEqual(
    `“${'x'.repeat(60)}…”`
  );
  expect(summarizeToolInput({ input: { filters: {} }, translate })).toEqual(
    'agent.toolResult.running'
  );
  expect(summarizeToolInput({ input: undefined, translate })).toEqual('agent.toolResult.running');
});

test('summarizeToolOutput counts results and fields, and cuts long text', () => {
  expect(summarizeToolOutput({ output: [1, 2, 3], translate })).toEqual(
    'agent.toolResult.returnedCount {"count":3}'
  );
  expect(summarizeToolOutput({ output: { a: 1, b: 2, c: 3, d: 4 }, translate })).toEqual(
    'agent.toolResult.returnedFields {"count":4}'
  );
  expect(summarizeToolOutput({ output: 'y'.repeat(90), translate })).toEqual(`${'y'.repeat(80)}…`);
  expect(summarizeToolOutput({ output: undefined, translate })).toEqual(
    'agent.toolResult.completedNoData'
  );
  expect(summarizeToolOutput({ output: 42, translate })).toEqual('42');
});
