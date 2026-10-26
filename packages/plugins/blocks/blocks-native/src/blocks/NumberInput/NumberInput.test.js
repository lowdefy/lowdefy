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

import { TextInput } from 'react-native';
import { act, fireEvent, screen } from '@testing-library/react-native';

import formPage from '../../test/formPage.js';
import { ios, renderPage, styleOf } from '../../test/renderPage.js';

test('typing a number sets a number in state', async () => {
  await renderPage({
    pageConfig: formPage({ blocks: [{ id: 'qty', type: 'NumberInput' }], mirrorKey: 'qty' }),
  });
  await act(async () => {
    fireEvent.changeText(await screen.findByTestId('qty_input'), '12.5');
  });
  expect(screen.getByText('12.5')).toBeTruthy();
  await act(async () => {
    fireEvent.changeText(screen.getByTestId('qty_input'), '-');
  });
  // Text on its way to a number keeps the last number.
  expect(screen.getByText('12.5')).toBeTruthy();
  expect(screen.getByTestId('qty_input').props.value).toBe('-');
});

test('a NumberInput keeps its value within min and max when it loses focus', async () => {
  await renderPage({
    pageConfig: formPage({
      blocks: [{ id: 'qty', type: 'NumberInput', properties: { min: 0, max: 10, precision: 1 } }],
      mirrorKey: 'qty',
    }),
  });
  const input = await screen.findByTestId('qty_input');
  expect(input.props.keyboardType).toBe('decimal-pad');
  await act(async () => {
    fireEvent.changeText(input, '42');
  });
  await act(async () => {
    fireEvent(screen.getByTestId('qty_input'), 'blur');
  });
  expect(screen.getByTestId('qty_input').props.value).toBe('10.0');
  expect(screen.getByText('10')).toBeTruthy();
});

test('the spinner buttons step the value', async () => {
  await renderPage({
    pageConfig: formPage({
      blocks: [
        { id: 'qty', type: 'NumberInput', properties: { mode: 'spinner', step: 2, max: 3 } },
      ],
      mirrorKey: 'qty',
    }),
  });
  await act(async () => {
    fireEvent.press(await screen.findByTestId('qty_increase'));
  });
  expect(screen.getByText('2')).toBeTruthy();
  await act(async () => {
    fireEvent.press(screen.getByTestId('qty_increase'));
  });
  expect(screen.getByText('3')).toBeTruthy();
  expect(screen.getByTestId('qty_input').props.value).toBe('3');
});

test('a required NumberInput shows its message after Validate', async () => {
  await renderPage({
    pageConfig: formPage({
      blocks: [{ id: 'qty', type: 'NumberInput', required: true }],
      mirrorKey: 'qty',
    }),
  });
  await screen.findByTestId('qty_input');
  await act(async () => {
    fireEvent.press(screen.getByText('Submit'));
  });
  expect(screen.getByTestId('qty_feedback')).toBeTruthy();
});

test('the row variant is a Settings row: the title at the left, the number right-aligned', async () => {
  await renderPage({
    pageConfig: formPage({
      blocks: [
        {
          id: 'qty',
          type: 'NumberInput',
          properties: { title: 'Quantity', variant: 'row', suffix: 'kg' },
        },
      ],
      mirrorKey: 'qty',
    }),
  });
  const input = await screen.findByTestId('qty_input');
  expect(screen.getByText('Quantity')).toBeTruthy();
  expect(screen.getByText('kg')).toBeTruthy();
  expect(input.props.placeholder).toBe('Not set');
  expect(input.props.placeholderTextColor).toBe(ios.light.colorSecondaryLabel);
  expect(styleOf(input)).toMatchObject({
    color: ios.light.colorSecondaryLabel,
    fontSize: 17,
    textAlign: 'right',
  });
  expect(styleOf(screen.getByTestId('qty_row'))).toMatchObject({
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 10,
  });
  // The title is the row's own; the label draws no title above it.
  expect(screen.queryByTestId('qty_label')).toBeNull();
  await act(async () => {
    fireEvent.press(screen.getByTestId('qty_row'));
  });
  expect(TextInput.prototype.focus).toHaveBeenCalledTimes(1);
  await act(async () => {
    fireEvent.changeText(screen.getByTestId('qty_input'), '4');
  });
  expect(screen.getByText('4')).toBeTruthy();
});
