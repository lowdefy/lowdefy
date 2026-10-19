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

import { ios, renderPage, styleOf } from '../../test/renderPage.js';

function formPage(inputs, events = {}) {
  return {
    id: 'form',
    type: 'Box',
    events,
    blocks: [
      ...inputs,
      { id: 'mirror', type: 'Paragraph', properties: { content: { _state: 'name' } } },
      {
        id: 'submit',
        type: 'Button',
        properties: { title: 'Submit' },
        events: { onClick: [{ id: 'validate', type: 'Validate' }] },
      },
    ],
  };
}

test('typing in a TextInput sets its value in state', async () => {
  await renderPage({
    pageConfig: formPage([{ id: 'name', type: 'TextInput', properties: { title: 'Name' } }]),
  });
  await act(async () => {
    fireEvent.changeText(await screen.findByTestId('name_input'), 'Ada');
  });
  expect(screen.getByText('Ada')).toBeTruthy();
  expect(screen.getByTestId('name_input').props.value).toBe('Ada');
});

test('a TextInput fires onChange with the typed value', async () => {
  await renderPage({
    pageConfig: formPage([
      {
        id: 'name',
        type: 'TextInput',
        events: {
          onChange: [{ id: 'copy', type: 'SetState', params: { copied: { _event: 'value' } } }],
        },
      },
      { id: 'copied_text', type: 'Paragraph', properties: { content: { _state: 'copied' } } },
    ]),
  });
  await act(async () => {
    fireEvent.changeText(await screen.findByTestId('name_input'), 'Grace');
  });
  expect(screen.getAllByText('Grace')).toHaveLength(2);
});

test('a required TextInput shows its message only after Validate', async () => {
  await renderPage({
    pageConfig: formPage([{ id: 'name', type: 'TextInput', required: true }]),
  });
  await screen.findByTestId('name_input');
  expect(screen.queryByTestId('name_feedback')).toBeNull();
  await act(async () => {
    fireEvent.press(screen.getByText('Submit'));
  });
  expect(screen.getByTestId('name_feedback').props.children).toBe('This field is required');
  await act(async () => {
    fireEvent.changeText(screen.getByTestId('name_input'), 'Ada');
  });
  expect(screen.queryByTestId('name_feedback')).toBeNull();
});

test('the label shows the title, the required mark and the extra text', async () => {
  await renderPage({
    pageConfig: formPage([
      {
        id: 'name',
        type: 'TextInput',
        required: true,
        properties: { title: 'Full name:', label: { extra: 'As on your ID' } },
      },
    ]),
  });
  expect((await screen.findByTestId('name_extra')).props.children).toBe('As on your ID');
  expect(screen.getByText('Full name', { exact: false })).toBeTruthy();
  expect(screen.getByText('*', { exact: false })).toBeTruthy();
  expect(screen.getByTestId('name_input').props.accessibilityLabel).toBe('Full name');
});

test('an email TextInput opens the email keyboard', async () => {
  await renderPage({
    pageConfig: formPage([{ id: 'email', type: 'TextInput', properties: { type: 'email' } }]),
  });
  const input = await screen.findByTestId('email_input');
  expect(input.props.keyboardType).toBe('email-address');
  expect(input.props.autoCapitalize).toBe('none');
});

test('replaceInput sanitizes the typed text', async () => {
  await renderPage({
    pageConfig: formPage([
      {
        id: 'name',
        type: 'TextInput',
        properties: { replaceInput: { pattern: '[0-9]' } },
      },
    ]),
  });
  await act(async () => {
    fireEvent.changeText(await screen.findByTestId('name_input'), 'A1d2a');
  });
  expect(screen.getByTestId('name_input').props.value).toBe('Ada');
});

test('allowClear clears the value and fires onClear', async () => {
  await renderPage({
    pageConfig: formPage([
      {
        id: 'name',
        type: 'TextInput',
        properties: { allowClear: true },
        events: { onClear: [{ id: 'note', type: 'SetState', params: { cleared: 'Cleared' } }] },
      },
      { id: 'cleared_text', type: 'Paragraph', properties: { content: { _state: 'cleared' } } },
    ]),
  });
  await act(async () => {
    fireEvent.changeText(await screen.findByTestId('name_input'), 'Ada');
  });
  await act(async () => {
    fireEvent.press(screen.getByTestId('name_clear'));
  });
  expect(screen.getByTestId('name_input').props.value).toBe('');
  expect(screen.getByText('Cleared')).toBeTruthy();
});

test('an input without a title has no label, not its block id', async () => {
  await renderPage({
    pageConfig: formPage([
      { id: 'space_id', type: 'TextInput', properties: { placeholder: 'Space' } },
    ]),
  });
  const input = await screen.findByTestId('space_id_input');
  expect(screen.queryByText('space_id')).toBeNull();
  expect(input.props.accessibilityLabel).toBe('Space');
});

test('a search TextInput is a search field with a clear button and Cancel while focused', async () => {
  await renderPage({
    pageConfig: formPage([
      {
        id: 'm_search',
        type: 'TextInput',
        properties: { variant: 'search' },
        events: { onClear: [{ id: 'note', type: 'SetState', params: { cleared: 'Cleared' } }] },
      },
      { id: 'cleared_text', type: 'Paragraph', properties: { content: { _state: 'cleared' } } },
    ]),
  });
  const input = await screen.findByTestId('m_search_input');
  expect(input.props.placeholder).toBe('Search');
  expect(input.props.returnKeyType).toBe('search');
  expect(screen.getByTestId('m_search_search_icon', { includeHiddenElements: true })).toBeTruthy();
  expect(screen.queryByText('m_search')).toBeNull();
  expect(screen.queryByTestId('m_search_clear')).toBeNull();
  expect(screen.queryByTestId('m_search_cancel')).toBeNull();
  await act(async () => {
    fireEvent(input, 'focus');
    fireEvent.changeText(input, 'design');
  });
  expect(screen.getByTestId('m_search_clear')).toBeTruthy();
  await act(async () => {
    fireEvent.press(screen.getByTestId('m_search_cancel'));
  });
  expect(screen.getByTestId('m_search_input').props.value).toBe('');
  expect(screen.getByText('Cleared')).toBeTruthy();
});

test('the row variant is a Settings row: the title at the left, the text right-aligned', async () => {
  const { calls } = await renderPage({
    pageConfig: formPage([
      {
        id: 'name',
        type: 'TextInput',
        properties: { title: 'Name', variant: 'row', allowClear: true },
        events: {
          onClear: [{ id: 'record', type: 'Record', params: { name: 'clear' } }],
        },
      },
    ]),
  });
  const input = await screen.findByTestId('name_input');
  expect(screen.getByText('Name')).toBeTruthy();
  expect(input.props.placeholder).toBe('Not set');
  expect(styleOf(input)).toMatchObject({
    color: ios.light.colorSecondaryLabel,
    fontSize: 17,
    textAlign: 'right',
  });
  await act(async () => {
    fireEvent.press(screen.getByTestId('name_row'));
  });
  expect(TextInput.prototype.focus).toHaveBeenCalledTimes(1);
  await act(async () => {
    fireEvent(screen.getByTestId('name_input'), 'focus');
    fireEvent.changeText(screen.getByTestId('name_input'), 'Ada');
  });
  expect(screen.getByText('Ada')).toBeTruthy();
  await act(async () => {
    fireEvent.press(screen.getByTestId('name_clear'));
  });
  expect(screen.getByTestId('name_input').props.value).toBe('');
  expect(calls).toEqual([{ name: 'clear' }]);
});
