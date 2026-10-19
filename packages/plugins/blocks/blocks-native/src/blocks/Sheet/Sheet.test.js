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

import { act, fireEvent } from '@testing-library/react-native';

import { page, press, record, renderPage, screen } from '../../test/renderPage.js';

function callMethod(method) {
  return [{ id: method, type: 'CallMethod', params: { blockId: 'answer_sheet', method } }];
}

// A page with an Answer button that opens a sheet holding a small form.
function sheetPage(sheetProperties = {}) {
  return page([
    {
      id: 'answer',
      type: 'Button',
      properties: { title: 'Answer' },
      events: { onClick: callMethod('open') },
    },
    {
      id: 'answer_sheet',
      type: 'Sheet',
      properties: { title: 'Answer question', ...sheetProperties },
      events: { onOpen: record('open'), onClose: record('close') },
      blocks: [
        {
          id: 'choice',
          type: 'Selector',
          properties: { title: 'Option', options: ['Ship it', 'Wait'] },
        },
        { id: 'note', type: 'TextArea', properties: { title: 'Note' } },
        {
          id: 'send',
          type: 'Button',
          properties: { title: 'Send' },
          events: { onClick: callMethod('close') },
        },
      ],
    },
    { id: 'note_mirror', type: 'Paragraph', properties: { content: { _state: 'note' } } },
  ]);
}

test('the open method presents the sheet with its blocks, and close dismisses it', async () => {
  const { calls } = await renderPage({ pageConfig: sheetPage() });
  await screen.findByText('Answer');
  expect(screen.queryByText('Answer question')).toBeNull();
  expect(screen.getByTestId('expo-ui-bottom-sheet').props.index).toBe(-1);

  await press(screen.getByText('Answer'));
  expect(screen.getByTestId('expo-ui-bottom-sheet').props.index).toBe(0);
  expect(screen.getByText('Answer question')).toBeTruthy();
  expect(screen.getByTestId('choice_input')).toBeTruthy();
  await act(async () => {
    fireEvent.changeText(screen.getByTestId('note_input'), 'Looks good');
  });
  // The sheet's inputs write page state.
  expect(screen.getAllByText('Looks good').length).toBeGreaterThan(0);

  await press(screen.getByText('Send'));
  expect(screen.getByTestId('expo-ui-bottom-sheet').props.index).toBe(-1);
  expect(screen.queryByTestId('note_input')).toBeNull();
  expect(screen.getByText('Looks good')).toBeTruthy();
  expect(calls.map((call) => call.name)).toEqual(['open', 'close']);
});

test('an open sheet closes when its screen stops being the one shown', async () => {
  const { setFocused } = await renderPage({ pageConfig: sheetPage() });
  await screen.findByText('Answer');
  await press(screen.getByText('Answer'));
  expect(screen.getByTestId('expo-ui-bottom-sheet').props.index).toBe(0);

  await setFocused(false);
  expect(screen.getByTestId('expo-ui-bottom-sheet').props.index).toBe(-1);
});

test('a swipe down closes the sheet and fires onClose once', async () => {
  const { calls } = await renderPage({ pageConfig: sheetPage() });
  await press(await screen.findByText('Answer'));
  await act(async () => {
    fireEvent(screen.getByTestId('expo-ui-bottom-sheet'), 'swipeDismiss');
  });
  expect(screen.getByTestId('expo-ui-bottom-sheet').props.index).toBe(-1);
  expect(calls.map((call) => call.name)).toEqual(['open', 'close']);
  // It opens again.
  await press(screen.getByText('Answer'));
  expect(screen.getByText('Answer question')).toBeTruthy();
});

test('both detents use the system detents, and a single detent hides the drag indicator', async () => {
  await renderPage({ pageConfig: sheetPage() });
  const sheet = await screen.findByTestId('expo-ui-bottom-sheet');
  expect(sheet.props.snapPoints).toBeUndefined();
  expect(sheet.props.handleComponent).toBeUndefined();
  expect(sheet.props.enablePanDownToClose).toBe(true);
  expect(sheet.props.enableDynamicSizing).toBe(false);
});

test('without drag to dismiss, the sheet shows a close button', async () => {
  const { calls } = await renderPage({
    pageConfig: sheetPage({ detents: 'large', dragToDismiss: false }),
  });
  const sheet = await screen.findByTestId('expo-ui-bottom-sheet');
  expect(sheet.props.snapPoints).toEqual(['100%']);
  expect(sheet.props.handleComponent).toBeNull();
  expect(sheet.props.enablePanDownToClose).toBe(false);
  await press(screen.getByText('Answer'));
  // The close glyph is the xmark SF Symbol on iOS.
  expect(screen.getByTestId('expo-ui-icon-xmark')).toBeTruthy();
  await press(screen.getByTestId('answer_sheet_close'));
  expect(screen.queryByText('Answer question')).toBeNull();
  expect(calls.map((call) => call.name)).toEqual(['open', 'close']);
});

test('a sheet drawn again keeps its presentation props, so iOS does not re-apply them', async () => {
  // The title follows the note, so typing draws the sheet again.
  await renderPage({ pageConfig: sheetPage({ detents: 'medium', title: { _state: 'note' } }) });
  await press(await screen.findByText('Answer'));
  const { backgroundStyle, snapPoints } = screen.getByTestId('expo-ui-bottom-sheet').props;
  await act(async () => {
    fireEvent.changeText(screen.getByTestId('note_input'), 'Looks good');
  });
  expect(screen.getByTestId('expo-ui-bottom-sheet').props.backgroundStyle).toBe(backgroundStyle);
  expect(screen.getByTestId('expo-ui-bottom-sheet').props.snapPoints).toBe(snapPoints);
});
