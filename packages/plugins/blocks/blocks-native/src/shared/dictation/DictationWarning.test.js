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
import { Linking, Text } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { translate as translateMessage } from '@lowdefy/helpers';

import DictationWarning from './DictationWarning.js';

const colors = { tint: '#007AFF', warning: '#FF9500', warningText: '#8A5300' };
const components = {
  Icon: ({ properties }) => <Text testID={`icon-${properties.name}`} />,
};

function translate(key) {
  return translateMessage({ key });
}

function renderWarning(warning) {
  return render(
    <DictationWarning
      colors={colors}
      components={components}
      testID="dictation_warning"
      translate={translate}
      warning={warning}
    />
  );
}

test('DictationWarning shows nothing without a warning', async () => {
  await renderWarning(null);
  expect(screen.queryByTestId('dictation_warning')).toBeNull();
});

test('DictationWarning says the microphone is off, with Settings opening the app settings', async () => {
  await renderWarning('denied');
  expect(screen.getByText('Microphone access is off.').props.style).toContainEqual({
    color: colors.warningText,
  });
  expect(screen.getByTestId('icon-TriangleAlert')).toBeTruthy();
  fireEvent.press(screen.getByText('Settings'));
  expect(Linking.openSettings).toHaveBeenCalledTimes(1);
});

test('DictationWarning says dictation stopped, without Settings, for other errors', async () => {
  await renderWarning('failed');
  expect(screen.getByText('Dictation stopped.')).toBeTruthy();
  expect(screen.queryByText('Settings')).toBeNull();
});
