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

import getSfSymbol from './getSfSymbol.js';

test('getSfSymbol passes SF Symbol names through', () => {
  expect(getSfSymbol('doc.on.doc')).toEqual('doc.on.doc');
  expect(getSfSymbol('trash')).toEqual('trash');
  expect(getSfSymbol({ sf: 'link', name: 'Link' })).toEqual('link');
});

test('getSfSymbol gives no symbol for a Lucide or semantic hyphenated name', () => {
  expect(getSfSymbol('Copy')).toBeUndefined();
  expect(getSfSymbol('chevron-right')).toBeUndefined();
  expect(getSfSymbol({ name: 'Copy' })).toBeUndefined();
  expect(getSfSymbol()).toBeUndefined();
});
