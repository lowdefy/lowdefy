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
import getSummaryCount from './getSummaryCount.js';

test('getSummaryCount counts the labels that end within the first line', () => {
  const labels = ['agent-rules', 'ui', 'docs', 'api'];
  expect(getSummaryCount({ labels, lineText: 'agent-rules, ui, ' })).toBe(2);
  expect(getSummaryCount({ labels, lineText: 'agent-rules, ui, docs, api' })).toBe(4);
  expect(getSummaryCount({ labels, lineText: 'agent-rules, ui' })).toBe(2);
});

test('getSummaryCount leaves out a label the line breaks inside', () => {
  expect(getSummaryCount({ labels: ['ui', 'needs design'], lineText: 'ui, needs ' })).toBe(1);
  expect(getSummaryCount({ labels: ['ui', 'ui-kit'], lineText: 'ui, ui-' })).toBe(1);
});

test('getSummaryCount shows at least the first label', () => {
  expect(getSummaryCount({ labels: ['agent-rules', 'ui'], lineText: 'agent-ru' })).toBe(1);
  expect(getSummaryCount({ labels: ['agent-rules'], lineText: '' })).toBe(1);
});
