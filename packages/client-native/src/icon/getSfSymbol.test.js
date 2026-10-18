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

test('getSfSymbol maps Lucide names to SF Symbols', () => {
  expect(getSfSymbol({ icon: 'Inbox' })).toEqual('tray');
  expect(getSfSymbol({ icon: 'FileText' })).toEqual('doc.text');
  expect(getSfSymbol({ icon: 'SquareCheck' })).toEqual('checkmark.square');
  expect(getSfSymbol({ icon: 'lucide:Search' })).toEqual('magnifyingglass');
});

test('getSfSymbol maps semantic names through the Lucide icon they draw', () => {
  expect(getSfSymbol({ icon: 'edit' })).toEqual('pencil');
  expect(getSfSymbol({ icon: 'delete' })).toEqual('trash');
  expect(getSfSymbol({ icon: 'chevron-right' })).toEqual('chevron.right');
  expect(getSfSymbol({ icon: 'refresh' })).toEqual('arrow.clockwise');
});

test('getSfSymbol takes a configured sfSymbol over the icon name', () => {
  expect(getSfSymbol({ icon: 'Inbox', sfSymbol: 'tray.full' })).toEqual('tray.full');
  expect(getSfSymbol({ sfSymbol: 'star.fill' })).toEqual('star.fill');
});

test('getSfSymbol returns null for a name with no symbol, another set, or no name', () => {
  expect(getSfSymbol({ icon: 'Squirrel' })).toBe(null);
  expect(getSfSymbol({ icon: 'tabler:Truck' })).toBe(null);
  expect(getSfSymbol({})).toBe(null);
});
