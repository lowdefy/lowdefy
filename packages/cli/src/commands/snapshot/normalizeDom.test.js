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

import normalizeDom from './normalizeDom.js';

test('normalizeDom replaces antd dev and prod hash classes', () => {
  const dom =
    '<div class="ant-btn css-dev-only-do-not-override-1x9kz3 ant-btn-primary"><span class="css-9a8b7c">x</span></div>';
  expect(normalizeDom({ dom })).toBe(
    '<div class="ant-btn css-[HASH] ant-btn-primary">\n<span class="css-[HASH]">x</span>\n</div>'
  );
});

test('normalizeDom leaves short css- class names alone', () => {
  expect(normalizeDom({ dom: '<div class="ant-btn-css-var css-var-r0"></div>' })).toBe(
    '<div class="ant-btn-css-var css-var-[HASH]">\n</div>'
  );
});

test('normalizeDom replaces rc generated ids and the aria attributes pointing at them', () => {
  const dom =
    '<input id="rc_select_12" aria-owns="rc_select_12_list" aria-controls="rc-tabs-3-panel-a"><ul id="rc_select_12_list" data-menu-id="rc-menu-uuid-49081-1-item"></ul>';
  expect(normalizeDom({ dom })).toBe(
    '<input id="rc-select-[N]" aria-owns="rc-select-[N]_list" aria-controls="rc-tabs-[N]-panel-a">\n<ul id="rc-select-[N]_list" data-menu-id="rc-menu-uuid-[UUID]-1-item">\n</ul>'
  );
});

test('normalizeDom replaces React useId values', () => {
  expect(normalizeDom({ dom: '<label for=":r1:">a</label><input id=":r1:">' })).toBe(
    '<label for="[RID]">a</label>\n<input id="[RID]">'
  );
});

test('normalizeDom replaces ISO timestamps and UUIDs', () => {
  const dom =
    '<span>2026-03-04T10:11:12.345Z</span><span>2026-03-04T10:11:12+02:00</span><span data-id="3fa85f64-5717-4562-b3fc-2c963f66afa6"></span>';
  expect(normalizeDom({ dom })).toBe(
    '<span>[TS]</span>\n<span>[TS]</span>\n<span data-id="[UUID]">\n</span>'
  );
});

test('normalizeDom leaves a plain date that is not a timestamp alone', () => {
  expect(normalizeDom({ dom: '<span>2026-03-04</span>' })).toBe('<span>2026-03-04</span>');
});

test('normalizeDom collapses whitespace and puts one element per line', () => {
  const dom = '<div>\n   <p>  Hello\n world </p>\n\n<p>Two</p>   </div>';
  expect(normalizeDom({ dom })).toBe('<div>\n<p> Hello world </p>\n<p>Two</p>\n</div>');
});

test('normalizeDom is idempotent', () => {
  const dom = '<div class="css-dev-only-do-not-override-abc12"><p id="rc_select_1">x</p></div>';
  const once = normalizeDom({ dom });
  expect(normalizeDom({ dom: once })).toBe(once);
});

test('normalizeDom replaces rc ids whose name has several segments or camelCase', () => {
  const dom =
    '<div id="rc-picker-panel-3"><span id="rc_virtualList_12"></span><li id="rc-tabs-0-panel-x"></li></div>';
  expect(normalizeDom({ dom })).toBe(
    '<div id="rc-picker-panel-[N]">\n<span id="rc-virtualList-[N]">\n</span>\n<li id="rc-tabs-[N]-panel-x">\n</li>\n</div>'
  );
});

test('normalizeDom keeps the rc-menu uuid rule ahead of the general rc rule', () => {
  expect(normalizeDom({ dom: '<li data-menu-id="rc-menu-uuid-49081-settings"></li>' })).toBe(
    '<li data-menu-id="rc-menu-uuid-[UUID]-settings">\n</li>'
  );
});
