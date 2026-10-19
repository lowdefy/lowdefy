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
import toUtcDay from './toUtcDay.js';
import { ios, renderPage, styleOf } from '../../test/renderPage.js';

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

async function pickMenu(id) {
  await act(async () => {
    fireEvent(screen.getByTestId('due_input'), 'pressAction', { nativeEvent: { event: id } });
  });
}

test('the row variant is a Settings row that opens a menu of days', async () => {
  const record = [];
  await renderPage(
    datePage({
      block: { id: 'due', type: 'DateSelector', properties: { title: 'Due', variant: 'row' } },
      record,
    })
  );
  const menu = await screen.findByTestId('due_input');
  expect(screen.getByText('Due')).toBeTruthy();
  expect(styleOf(screen.getByText('Not set')).color).toBe(ios.light.colorSecondaryLabel);
  expect(screen.getByTestId('expo-ui-icon-chevron.up.chevron.down')).toBeTruthy();
  expect(menu.props.actions.map((action) => action.title)).toEqual([
    'Today',
    'Tomorrow',
    'Next week',
    'Pick a date…',
  ]);
  const today = toUtcDay({ date: new Date() });
  await pickMenu('tomorrow');
  expect(record).toEqual([new Date(today.getTime() + 24 * 60 * 60 * 1000)]);
  expect(screen.getByTestId('due_input').props.actions[1].state).toBe('on');
  expect(screen.getByTestId('due_input').props.actions.at(-1).title).toBe('Clear');
  await pickMenu('clear');
  expect(record.at(-1)).toBeNull();
  expect(screen.getByText('Not set')).toBeTruthy();
});

test('Pick a date opens the calendar under the row', async () => {
  const record = [];
  await renderPage(
    datePage({
      block: { id: 'due', type: 'DateSelector', properties: { title: 'Due', variant: 'row' } },
      record,
    })
  );
  await screen.findByTestId('due_input');
  expect(screen.queryByTestId('due_picker')).toBeNull();
  await pickMenu('pick');
  await act(async () => {
    fireEvent(screen.getByTestId('due_picker'), 'valueChange', {}, new Date(2026, 9, 18));
  });
  expect(record).toEqual([new Date(Date.UTC(2026, 9, 18))]);
  expect(screen.getByText('2026-10-18')).toBeTruthy();
  expect(screen.queryByTestId('due_picker')).toBeNull();
});
