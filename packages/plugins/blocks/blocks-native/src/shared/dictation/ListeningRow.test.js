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
import { AccessibilityInfo, StyleSheet, Text } from 'react-native';
import { jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { translate as translateMessage } from '@lowdefy/helpers';

import ListeningRow from './ListeningRow.js';

const colors = {
  danger: '#FF3B30',
  fillStrong: 'rgba(120,120,128,0.2)',
  secondary: 'rgba(60,60,67,0.6)',
};
const components = {
  Icon: ({ properties }) => <Text testID={`icon-${properties.name}`} />,
};

function translate(key) {
  return translateMessage({ key });
}

async function renderRow({ level = 0, onCancel = jest.fn() } = {}) {
  const view = await render(
    <ListeningRow
      colors={colors}
      components={components}
      level={level}
      onCancel={onCancel}
      testID="dictation"
      translate={translate}
    />
  );
  return { ...view, onCancel };
}

test('ListeningRow shows a cancel cross, the level meter and Listening', async () => {
  const { onCancel } = await renderRow();
  expect(screen.getByText('Listening')).toBeTruthy();
  expect(screen.getByTestId('icon-X')).toBeTruthy();
  fireEvent.press(screen.getByLabelText('Cancel dictation'));
  expect(onCancel).toHaveBeenCalledTimes(1);
});

test('ListeningRow announces Listening once, when it appears', async () => {
  const { rerender } = await renderRow();
  expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith('Listening');
  await rerender(
    <ListeningRow
      colors={colors}
      components={components}
      level={0.8}
      onCancel={jest.fn()}
      testID="dictation"
      translate={translate}
    />
  );
  expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledTimes(1);
});

test('ListeningRow draws eight red bars that follow the level', async () => {
  const { rerender } = await renderRow({ level: 0 });
  const heights = () =>
    screen
      .getByTestId('dictation_level', { includeHiddenElements: true })
      .children.map((bar) => StyleSheet.flatten(bar.props.style));
  expect(heights()).toHaveLength(8);
  heights().forEach((style) => {
    expect(style).toMatchObject({ backgroundColor: colors.danger, height: 4, width: 3 });
  });
  await rerender(
    <ListeningRow
      colors={colors}
      components={components}
      level={1}
      onCancel={jest.fn()}
      testID="dictation"
      translate={translate}
    />
  );
  expect(Math.max(...heights().map((style) => style.height))).toBe(22);
});
