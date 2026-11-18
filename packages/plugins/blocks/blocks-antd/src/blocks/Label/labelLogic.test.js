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

import { expect, test } from 'vitest';

import labelLogic from './labelLogic.js';

function spacing(properties) {
  const { labelColStyle, rowStyle } = labelLogic({
    blockId: 'field',
    content: {},
    properties,
  });
  return { labelGap: labelColStyle.marginBottom, fieldGap: rowStyle.marginBottom };
}

test('labelLogic gives a stacked field 16px below it and 8px between label and input', () => {
  expect(spacing({ title: 'Name' })).toEqual({
    labelGap: 8,
    fieldGap: 'var(--lf-field-gap, 16px)',
  });
});

test('labelLogic gives a small stacked field 4px below it and 2px between label and input', () => {
  expect(spacing({ title: 'Name', size: 'small' })).toEqual({
    labelGap: 2,
    fieldGap: 'var(--lf-field-gap-small, 4px)',
  });
});

test('labelLogic gives a large stacked field the default spacing', () => {
  expect(spacing({ title: 'Name', size: 'large' })).toEqual({
    labelGap: 8,
    fieldGap: 'var(--lf-field-gap, 16px)',
  });
});

test('labelLogic gives a field with its label beside the input on wide screens the field gap', () => {
  expect(spacing({ title: 'Name', span: 8 }).fieldGap).toEqual('var(--lf-field-gap, 16px)');
});

test('labelLogic gives an inline field no field gap and keeps its label gap', () => {
  expect(spacing({ title: 'Name', inline: true })).toEqual({ labelGap: 8, fieldGap: 0 });
  expect(spacing({ title: 'Name', inline: true, size: 'small' })).toEqual({
    labelGap: 0,
    fieldGap: 0,
  });
});

test('labelLogic gives a field with a disabled label no field gap', () => {
  expect(spacing({ title: 'Name', disabled: true }).fieldGap).toEqual(0);
});

test('labelLogic gives a field with an empty title no field gap', () => {
  expect(spacing({ title: '' }).fieldGap).toEqual(0);
});

test('labelLogic gives a field labelled by its blockId the field gap', () => {
  expect(spacing({}).fieldGap).toEqual('var(--lf-field-gap, 16px)');
});

test('labelLogic lets the row style override the field gap', () => {
  const { rowStyle } = labelLogic({
    blockId: 'field',
    content: {},
    properties: { title: 'Name' },
    rowStyle: { marginBottom: 24 },
  });
  expect(rowStyle.marginBottom).toEqual(24);
});
