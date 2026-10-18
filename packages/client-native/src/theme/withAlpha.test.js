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

import withAlpha from './withAlpha.js';

test('withAlpha turns a six digit hex colour into rgba at the opacity', () => {
  expect(withAlpha({ alpha: 0.14, color: '#6366f1' })).toBe('rgba(99,102,241,0.14)');
});

test('withAlpha expands a three digit hex colour and drops a hex alpha', () => {
  expect(withAlpha({ alpha: 0.5, color: '#fff' })).toBe('rgba(255,255,255,0.5)');
  expect(withAlpha({ alpha: 0.2, color: '#000000ff' })).toBe('rgba(0,0,0,0.2)');
});

test('withAlpha returns a colour that is not hex as written', () => {
  expect(withAlpha({ alpha: 0.2, color: 'rgb(1, 2, 3)' })).toBe('rgb(1, 2, 3)');
});
