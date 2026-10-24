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

import React from 'react';
import { Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';

import PartialSpans from './PartialSpans.js';

const GREY = 'rgba(60,60,67,0.6)';

async function spansOf({ partial, selection, text }) {
  await render(
    <Text testID="input">
      <PartialSpans color={GREY} partial={partial} selection={selection} text={text} />
    </Text>
  );
  return screen.getByTestId('input').children.map((span) => ({
    text: span.children.join(''),
    color: span.props.style?.color,
  }));
}

test('PartialSpans shows the partial words grey at the cursor, spaced as they will commit', async () => {
  expect(
    await spansOf({
      partial: 'for Sam',
      selection: { start: 11, end: 11 },
      text: 'Looks good. Thanks',
    })
  ).toEqual([
    { text: 'Looks good.', color: undefined },
    { text: ' for Sam', color: GREY },
    { text: ' Thanks', color: undefined },
  ]);
});

test('PartialSpans shows the partial words in place of the selection they will replace', async () => {
  expect(
    await spansOf({
      partial: 'fence',
      selection: { start: 10, end: 14 },
      text: 'Check the gate log',
    })
  ).toEqual([
    { text: 'Check the ', color: undefined },
    { text: 'fence', color: GREY },
    { text: ' log', color: undefined },
  ]);
});

test('PartialSpans puts the partial words at the end without a selection', async () => {
  expect(await spansOf({ partial: 'are waiting', text: 'Which tasks' })).toEqual([
    { text: 'Which tasks', color: undefined },
    { text: ' are waiting', color: GREY },
    { text: '', color: undefined },
  ]);
});

test('PartialSpans shows the text alone before any words are heard', async () => {
  expect(
    await spansOf({ partial: '', selection: { start: 0, end: 0 }, text: 'Looks good.' })
  ).toEqual([{ text: 'Looks good.', color: undefined }]);
});
