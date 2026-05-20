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

import resolveTemplateId from './resolveTemplateId.js';

test('returns id unchanged when no numeric segments are present', () => {
  expect(resolveTemplateId('next_button')).toBe('next_button');
  expect(resolveTemplateId('form.email_input')).toBe('form.email_input');
});

test('replaces a single numeric segment with `$`', () => {
  expect(resolveTemplateId('legal_rows.0.toggle')).toBe('legal_rows.$.toggle');
  expect(resolveTemplateId('legal_rows.12.toggle')).toBe('legal_rows.$.toggle');
});

test('replaces every numeric segment for nested lists', () => {
  expect(resolveTemplateId('outer.0.inner.2.button')).toBe('outer.$.inner.$.button');
});

test('does not replace segments that contain digits but are not all digits', () => {
  // The whole segment must be digits; `step_1d` includes letters and stays put.
  expect(resolveTemplateId('step_1d_input')).toBe('step_1d_input');
  expect(resolveTemplateId('list.row42.btn')).toBe('list.row42.btn');
  expect(resolveTemplateId('list.42a.btn')).toBe('list.42a.btn');
});

test('treats `0` and large indices the same', () => {
  expect(resolveTemplateId('list.0.btn')).toBe('list.$.btn');
  expect(resolveTemplateId('list.999999.btn')).toBe('list.$.btn');
});

test('passes single-segment ids through unchanged', () => {
  expect(resolveTemplateId('home')).toBe('home');
});
