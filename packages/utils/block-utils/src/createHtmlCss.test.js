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

import createHtmlCss from './createHtmlCss.js';
import tagStyle from './format/tagStyle.js';
import TONE_COLORS from './format/toneColors.js';

test('createHtmlCss scopes every rule to enhanced HTML with no specificity', () => {
  const css = createHtmlCss();
  expect(css.startsWith('/* Generated')).toBe(true);
  expect(css).toContain('@layer components {');
  const selectors = css.match(/^\s*:where\([^)]*\)/gm);
  selectors.forEach((selector) => {
    expect(selector.trim().startsWith(':where([data-lf-html] ')).toBe(true);
  });
});

test('createHtmlCss writes the grid tag look and every tone', () => {
  const css = createHtmlCss();
  expect(css).toContain(`background: ${tagStyle('var(--lf-tone)').background};`);
  Object.entries(TONE_COLORS).forEach(([tone, color]) => {
    expect(css).toContain(`:where([data-lf-html] [data-tag="${tone}"]),`);
    expect(css).toContain(
      `:where([data-lf-html] [data-status="${tone}"]) {\n    --lf-tone: ${color};`
    );
  });
});

test('createHtmlCss output', () => {
  expect(createHtmlCss()).toMatchSnapshot();
});
