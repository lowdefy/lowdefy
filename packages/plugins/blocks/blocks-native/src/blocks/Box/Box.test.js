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

import { ios, page, press, record, renderPage, screen, styleOf } from '../../test/renderPage.js';

test('a Box draws its content slot, with the block id as its testID', async () => {
  await renderPage({
    pageConfig: page([
      {
        id: 'panel',
        type: 'Box',
        blocks: [{ id: 'inner', type: 'Box', properties: { content: 'Inside' } }],
      },
    ]),
  });
  expect(await screen.findByText('Inside')).toBeTruthy();
  expect(screen.getByTestId('panel')).toBeTruthy();
  expect(screen.getByTestId('panel').props.accessibilityLabel).toBe('panel');
  expect(screen.getByTestId('inner')).toBeTruthy();
});

test('a Box content string is drawn in the theme text colour, and in dark mode', async () => {
  await renderPage({ pageConfig: page([{ id: 'a', type: 'Box', properties: { content: 'Hi' } }]) });
  expect(styleOf(await screen.findByText('Hi')).color).toBe(ios.light.colorLabel);
  await renderPage({
    darkMode: 'dark',
    pageConfig: page([{ id: 'a', type: 'Box', properties: { content: 'Hi' } }]),
  });
  expect(styleOf(await screen.findByText('Hi')).color).toBe(ios.dark.colorLabel);
});

test('a Box with onClick is a button that fires onClick', async () => {
  const { calls } = await renderPage({
    pageConfig: page([
      {
        id: 'tap',
        type: 'Box',
        properties: { content: 'Tap me' },
        style: { element: { padding: 8 } },
        events: { onClick: record('click') },
      },
    ]),
  });
  const button = await screen.findByRole('button');
  expect(styleOf(button).padding).toBe(8);
  await press(screen.getByText('Tap me'));
  expect(calls.map((call) => call.name)).toEqual(['click']);
});

test('a Box evaluated visible false is not drawn', async () => {
  await renderPage({
    pageConfig: page([
      { id: 'shown', type: 'Box', properties: { content: 'Shown' } },
      { id: 'hidden', type: 'Box', visible: false, properties: { content: 'Hidden' } },
    ]),
  });
  await screen.findByText('Shown');
  expect(screen.queryByText('Hidden')).toBeNull();
  expect(screen.queryByTestId('hidden')).toBeNull();
});

// A one-finger drag from (x0, y0) to (x, y) over `ms`, as React Native's touch history holds it.
function touchEvent({ ms = 300, x, x0, y = 300, y0 = 300 }) {
  return {
    nativeEvent: { touches: [{}] },
    touchHistory: {
      indexOfSingleActiveTouch: 0,
      mostRecentTimeStamp: ms,
      numberActiveTouches: 1,
      touchBank: [
        {
          currentPageX: x,
          currentPageY: y,
          currentTimeStamp: ms,
          previousPageX: x0,
          previousPageY: y0,
          previousTimeStamp: 0,
          startPageX: x0,
          startPageY: y0,
          startTimeStamp: 0,
          touchActive: true,
        },
      ],
    },
  };
}

// Drags the Box's swipe view, as the responder system asks it: whether it takes the move (the
// capture phase, then the bubble phase), then, if it does, the grant and the release. Returns
// whether it took the drag.
async function drag(view, from, to) {
  const start = touchEvent({ ms: 0, x: from.x, x0: from.x, y: from.y, y0: from.y });
  const move = touchEvent({ x: to.x, x0: from.x, y: to.y, y0: from.y });
  view.props.onStartShouldSetResponderCapture(start);
  view.props.onMoveShouldSetResponderCapture(move);
  const taken = view.props.onMoveShouldSetResponder(move);
  if (taken) {
    await act(async () => {
      view.props.onResponderGrant(move);
      view.props.onResponderRelease(move);
    });
  }
  return taken;
}

// The first view at or under the Box's block view that answers the responder system's moves.
function findSwipeView(node) {
  if (typeof node === 'string') return undefined;
  if (node.props.onMoveShouldSetResponder) return node;
  return (node.children ?? []).map(findSwipeView).find((found) => found !== undefined);
}

function swipeView(blockId) {
  return findSwipeView(screen.getByTestId(blockId));
}

const swipePage = (properties = {}, events = {}) =>
  page([
    {
      id: 'card',
      type: 'Box',
      properties: { content: 'Design', ...properties },
      events: { onSwipeLeft: record('left'), onSwipeRight: record('right'), ...events },
    },
  ]);

test('a Box fires onSwipeLeft and onSwipeRight for clear horizontal swipes', async () => {
  const { calls } = await renderPage({ pageConfig: swipePage() });
  await screen.findByText('Design');
  expect(await drag(swipeView('card'), { x: 300, y: 300 }, { x: 200, y: 310 })).toBe(true);
  expect(await drag(swipeView('card'), { x: 100, y: 300 }, { x: 200, y: 290 })).toBe(true);
  expect(calls.map((call) => call.name)).toEqual(['left', 'right']);
});

test('a Box leaves vertical scrolls and the back gesture to the page', async () => {
  const { calls } = await renderPage({ pageConfig: swipePage() });
  await screen.findByText('Design');
  // A scroll down the page.
  expect(await drag(swipeView('card'), { x: 200, y: 400 }, { x: 230, y: 250 })).toBe(false);
  // A drag from 10pt from the screen's left edge: iOS's back gesture.
  expect(await drag(swipeView('card'), { x: 10, y: 300 }, { x: 150, y: 300 })).toBe(false);
  expect(calls).toEqual([]);
});

test('a Box takes swipes only in the directions it has events for', async () => {
  const { calls } = await renderPage({
    pageConfig: page([
      {
        id: 'card',
        type: 'Box',
        properties: { content: 'Design' },
        events: { onSwipeLeft: record('left') },
      },
    ]),
  });
  await screen.findByText('Design');
  expect(await drag(swipeView('card'), { x: 100, y: 300 }, { x: 200, y: 300 })).toBe(false);
  expect(await drag(swipeView('card'), { x: 300, y: 300 }, { x: 200, y: 300 })).toBe(true);
  expect(calls.map((call) => call.name)).toEqual(['left']);
});

test('a pressable Box with swipe events still fires onClick when tapped', async () => {
  const { calls } = await renderPage({
    pageConfig: swipePage({}, { onClick: record('click') }),
  });
  await press(await screen.findByText('Design'));
  expect(await drag(swipeView('card'), { x: 300, y: 300 }, { x: 200, y: 300 })).toBe(true);
  expect(calls.map((call) => call.name)).toEqual(['click', 'left']);
});

test('a Box with swipe events gives screen readers swipe actions', async () => {
  const { calls } = await renderPage({ pageConfig: swipePage({}, { onClick: record('click') }) });
  const button = await screen.findByRole('button');
  expect(button.props.accessibilityActions).toEqual([
    { label: 'Swipe left', name: 'swipeLeft' },
    { label: 'Swipe right', name: 'swipeRight' },
  ]);
  await act(async () => {
    fireEvent(button, 'accessibilityAction', { nativeEvent: { actionName: 'swipeRight' } });
  });
  expect(calls.map((call) => call.name)).toEqual(['right']);
});

test('a Box with swipeFeedback moves with the drag on a rubber band', async () => {
  await renderPage({ pageConfig: swipePage({ swipeFeedback: true }) });
  await screen.findByText('Design');
  const view = swipeView('card');
  const from = { x: 300, y: 300 };
  view.props.onStartShouldSetResponderCapture(
    touchEvent({ ms: 0, x: from.x, x0: from.x, y: from.y, y0: from.y })
  );
  const move = touchEvent({ x: 250, x0: 300 });
  view.props.onMoveShouldSetResponderCapture(move);
  expect(view.props.onMoveShouldSetResponder(move)).toBe(true);
  await act(async () => {
    view.props.onResponderGrant(move);
    // 40pt further left since the Box took the swipe.
    view.props.onResponderMove({
      ...move,
      touchHistory: {
        ...move.touchHistory,
        mostRecentTimeStamp: 400,
        touchBank: [
          {
            ...move.touchHistory.touchBank[0],
            currentPageX: 210,
            currentTimeStamp: 400,
            previousPageX: 250,
            previousTimeStamp: 300,
          },
        ],
      },
    });
  });
  expect(styleOf(swipeView('card')).transform[0].translateX).toBeCloseTo(-15.09, 1);
});

test('a Box without swipe events takes no drags', async () => {
  await renderPage({
    pageConfig: page([{ id: 'plain', type: 'Box', properties: { content: 'Hi' } }]),
  });
  await screen.findByText('Hi');
  expect(swipeView('plain')).toBeUndefined();
});
