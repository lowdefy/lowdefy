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

import { act, fireEvent, screen } from '@testing-library/react-native';

import formPage from '../../test/formPage.js';
import renderPage from '../../test/renderPage.js';

function datePage({ block, record }) {
  return {
    actions: { Record: ({ params }) => record.push(params) },
    pageConfig: formPage({
      blocks: [
        {
          ...block,
          events: { onChange: [{ id: 'record', type: 'Record', params: { _event: 'value' } }] },
        },
      ],
      mirrorKey: 'nothing',
    }),
  };
}

test('picking a day sets that day at midnight UTC and shows it', async () => {
  const record = [];
  await renderPage(datePage({ block: { id: 'due', type: 'DateSelector' }, record }));
  const field = await screen.findByTestId('due_input');
  expect(screen.getByText('Select date')).toBeTruthy();
  expect(screen.queryByTestId('due_picker')).toBeNull();
  await act(async () => {
    fireEvent.press(field);
  });
  const picker = screen.getByTestId('due_picker');
  expect(picker.props.mode).toBe('date');
  await act(async () => {
    fireEvent(picker, 'valueChange', {}, new Date(2026, 9, 18, 15, 30));
  });
  expect(record).toEqual([new Date(Date.UTC(2026, 9, 18))]);
  expect(screen.getByText('2026-10-18')).toBeTruthy();
  expect(screen.queryByTestId('due_picker')).toBeNull();
});

test('the picker opens on the chosen day and takes the min and max days', async () => {
  const record = [];
  await renderPage(
    datePage({
      block: {
        id: 'due',
        type: 'DateSelector',
        properties: {
          format: 'DD/MM/YYYY',
          disabledDates: { min: '2026-10-01', max: '2026-10-31' },
        },
      },
      record,
    })
  );
  await act(async () => {
    fireEvent.press(await screen.findByTestId('due_input'));
  });
  await act(async () => {
    fireEvent(screen.getByTestId('due_picker'), 'valueChange', {}, new Date(2026, 9, 5));
  });
  expect(screen.getByText('05/10/2026')).toBeTruthy();
  await act(async () => {
    fireEvent.press(screen.getByTestId('due_input'));
  });
  const picker = screen.getByTestId('due_picker');
  expect(picker.props.value).toEqual(new Date(2026, 9, 5));
  expect(picker.props.minimumDate).toEqual(new Date(2026, 9, 1));
  expect(picker.props.maximumDate).toEqual(new Date(2026, 9, 31));
  await act(async () => {
    fireEvent(picker, 'dismiss');
  });
  expect(screen.queryByTestId('due_picker')).toBeNull();
});

test('clearing a DateSelector sets null', async () => {
  const record = [];
  await renderPage(datePage({ block: { id: 'due', type: 'DateSelector' }, record }));
  await act(async () => {
    fireEvent.press(await screen.findByTestId('due_input'));
  });
  await act(async () => {
    fireEvent(screen.getByTestId('due_picker'), 'valueChange', {}, new Date(2026, 0, 2));
  });
  await act(async () => {
    fireEvent.press(screen.getByTestId('due_clear'));
  });
  expect(record).toEqual([new Date(Date.UTC(2026, 0, 2)), null]);
  expect(screen.getByText('Select date')).toBeTruthy();
});

test('a required DateSelector shows its message after Validate', async () => {
  const record = [];
  await renderPage(
    datePage({ block: { id: 'due', type: 'DateSelector', required: true }, record })
  );
  await screen.findByTestId('due_input');
  await act(async () => {
    fireEvent.press(screen.getByText('Submit'));
  });
  expect(screen.getByTestId('due_feedback')).toBeTruthy();
});
