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
import { StyleSheet, Text } from 'react-native';
import { jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { translate as translateMessage } from '@lowdefy/helpers';

import DictationButton from './DictationButton.js';

const colors = { danger: '#FF3B30', onTint: '#FFFFFF', secondary: 'rgba(60,60,67,0.6)' };
const components = {
  Icon: ({ properties }) => <Text testID={`icon-${properties.name}`} />,
};

function translate(key) {
  return translateMessage({ key });
}

test('DictationButton shows the microphone while idle and starts dictation on press', async () => {
  const onPress = jest.fn();
  await render(
    <DictationButton
      colors={colors}
      components={components}
      onPress={onPress}
      status="idle"
      testID="mic"
      translate={translate}
    />
  );
  const button = screen.getByLabelText('Dictate');
  expect(screen.getByTestId('expo-ui-icon-mic').props.color).toBe(colors.secondary);
  expect(StyleSheet.flatten(button.props.style).backgroundColor).toBeUndefined();
  fireEvent.press(button);
  expect(onPress).toHaveBeenCalledTimes(1);
});

test('DictationButton shows a red stop while listening or stopping', async () => {
  const { rerender } = await render(
    <DictationButton
      colors={colors}
      components={components}
      onPress={jest.fn()}
      status="listening"
      testID="mic"
      translate={translate}
    />
  );
  const button = screen.getByLabelText('Stop dictation');
  expect(StyleSheet.flatten(button.props.style)).toMatchObject({
    backgroundColor: colors.danger,
    height: 28,
    width: 28,
  });
  expect(screen.queryByTestId('expo-ui-icon-mic')).toBeNull();
  await rerender(
    <DictationButton
      colors={colors}
      components={components}
      onPress={jest.fn()}
      status="stopping"
      testID="mic"
      translate={translate}
    />
  );
  expect(screen.getByLabelText('Stop dictation')).toBeTruthy();
});
