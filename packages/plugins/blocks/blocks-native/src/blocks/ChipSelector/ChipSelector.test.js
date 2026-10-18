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
import { ScrollView } from 'react-native';

import { ios, page, press, record, renderPage, screen, styleOf } from '../../test/renderPage.js';

const blue = { fg: '#0A6BC9', bg: '#E2EDF9', fgDark: '#85B5E4', bgDark: '#1E3B59' };
const green = { fg: '#1E7F46', bg: '#E4F0E9', fgDark: '#8FBFA3', bgDark: '#244134' };

const spaces = {
  id: 'space',
  type: 'ChipSelector',
  properties: {
    title: 'Space',
    moreChip: { label: 'All spaces', icon: 'House' },
    options: [
      { value: 'PEL', label: 'Pelican', icon: 'House', color: blue, badge: 3 },
      { value: 'GRW', label: 'Growth', icon: 'House', color: green },
      { value: 'OPS', label: 'Operations', color: 'purple' },
    ],
  },
  events: { onChange: record('change'), onMore: record('more') },
};

function spacesPage(block = spaces, events = {}) {
  return page(
    [
      block,
      {
        id: 'mirror',
        type: 'Paragraph',
        properties: { content: { _state: 'space' } },
      },
    ],
    { events }
  );
}

const selectPel = { onInit: [{ id: 'pel', type: 'SetState', params: { space: 'PEL' } }] };

test('pressing a chip sets its value and fires onChange, once', async () => {
  const { calls } = await renderPage({ pageConfig: spacesPage() });
  await press(await screen.findByTestId('space_GRW'));
  expect(calls).toEqual([{ name: 'change', event: { value: 'GRW' } }]);
  expect(screen.getByText('GRW')).toBeTruthy();
  expect(screen.getByTestId('space_GRW').props.accessibilityState).toMatchObject({
    selected: true,
  });
  // Pressing the chip already picked changes nothing.
  await press(screen.getByTestId('space_GRW'));
  expect(calls).toHaveLength(1);
});

test('an unselected chip sits on the system fill, a selected one on its own tint', async () => {
  await renderPage({ pageConfig: spacesPage(spaces, selectPel) });
  const pelican = await screen.findByTestId('space_PEL');
  expect(styleOf(pelican)).toMatchObject({
    backgroundColor: '#E2EDF9',
    borderColor: '#0A6BC9',
    borderRadius: 16,
    borderWidth: 1,
    height: 32,
  });
  expect(styleOf(screen.getByText('Pelican'))).toMatchObject({
    color: '#0A6BC9',
    fontSize: 15,
    fontWeight: '600',
  });
  expect(screen.getByText('3')).toBeTruthy();
  expect(pelican.props.accessibilityLabel).toBe('Pelican, 3');
  const growth = screen.getByTestId('space_GRW');
  expect(styleOf(growth)).toMatchObject({
    backgroundColor: ios.light.colorSystemFill,
    borderColor: 'transparent',
  });
  expect(styleOf(screen.getByText('Growth')).color).toBe(ios.light.colorLabel);
});

test('a chip takes the dark variants of its colour in dark mode', async () => {
  await renderPage({ darkMode: 'dark', pageConfig: spacesPage(spaces, selectPel) });
  expect(styleOf(await screen.findByTestId('space_PEL'))).toMatchObject({
    backgroundColor: '#1E3B59',
    borderColor: '#85B5E4',
  });
  expect(styleOf(screen.getByTestId('space_GRW')).backgroundColor).toBe(ios.dark.colorSystemFill);
});

test('the more chip fires onMore and picks nothing', async () => {
  const { calls } = await renderPage({ pageConfig: spacesPage() });
  await press(await screen.findByTestId('space_more'));
  expect(calls).toEqual([{ name: 'more' }]);
  expect(screen.getByText('All spaces')).toBeTruthy();
});

test('a disabled strip ignores presses', async () => {
  const { calls } = await renderPage({
    pageConfig: spacesPage({ ...spaces, properties: { ...spaces.properties, disabled: true } }),
  });
  await press(await screen.findByTestId('space_GRW'));
  expect(calls).toEqual([]);
});

test('the strip scrolls the selected chip into view once it is laid out', async () => {
  await renderPage({ pageConfig: spacesPage(spaces, selectPel) });
  const scroll = await screen.findByTestId('space_scroll');
  // The selected chip ends past the strip's view: once the strip, its content and the chip are
  // laid out, the strip scrolls to it without animation.
  await act(async () => {
    fireEvent(scroll, 'layout', { nativeEvent: { layout: { width: 200, height: 32 } } });
  });
  await act(async () => {
    fireEvent(scroll, 'contentSizeChange', 600, 32);
  });
  expect(ScrollView.prototype.scrollTo).not.toHaveBeenCalled();
  await act(async () => {
    fireEvent(screen.getByTestId('space_PEL').parent, 'layout', {
      nativeEvent: { layout: { x: 300, y: 0, width: 100, height: 32 } },
    });
  });
  expect(ScrollView.prototype.scrollTo).toHaveBeenCalledWith({ animated: false, x: 224, y: 0 });
  // Picking another chip scrolls to it with animation.
  await act(async () => {
    fireEvent(screen.getByTestId('space_GRW').parent, 'layout', {
      nativeEvent: { layout: { x: 420, y: 0, width: 90, height: 32 } },
    });
  });
  await press(screen.getByTestId('space_GRW'));
  expect(ScrollView.prototype.scrollTo).toHaveBeenLastCalledWith({ animated: true, x: 334, y: 0 });
});

test("in a Screen's headerBottom the strip cancels the screen inset to run edge to edge", async () => {
  await renderPage({
    pageConfig: {
      id: 'designs',
      type: 'Screen',
      properties: { title: 'Designs', largeTitle: true },
      slots: {
        headerBottom: { blocks: [spaces] },
        content: { blocks: [{ id: 'body', type: 'Paragraph', properties: { content: 'Body' } }] },
      },
    },
  });
  expect(styleOf(await screen.findByTestId('space_input'))).toMatchObject({
    marginHorizontal: -16,
  });
  expect(screen.getByTestId('designs_header_bottom')).toBeTruthy();
  // Elsewhere the strip keeps to its area.
  await renderPage({ pageConfig: spacesPage() });
  expect(styleOf(await screen.findByTestId('space_input')).marginHorizontal).toBeUndefined();
});

async function layOut({ content, viewport }) {
  const scroll = await screen.findByTestId('space_scroll');
  await act(async () => {
    fireEvent(scroll, 'layout', { nativeEvent: { layout: { width: viewport, height: 32 } } });
  });
  await act(async () => {
    fireEvent(scroll, 'contentSizeChange', content, 32);
  });
  return screen.getByTestId('space_scroll');
}

test('a strip whose chips fit neither scrolls nor bounces, so a Box around it takes the swipe', async () => {
  await renderPage({ pageConfig: spacesPage() });
  const scroll = await layOut({ content: 300, viewport: 402 });
  expect(scroll.props.scrollEnabled).toBe(false);
  expect(scroll.props.alwaysBounceHorizontal).toBe(false);
});

test('a strip whose chips overflow scrolls', async () => {
  await renderPage({ pageConfig: spacesPage() });
  const scroll = await layOut({ content: 700, viewport: 402 });
  expect(scroll.props.scrollEnabled).toBe(true);
});

test('a strip in a swipe Box passes a pull past its end on as the swipe that way', async () => {
  const { calls } = await renderPage({
    pageConfig: page([
      {
        id: 'bar',
        type: 'Box',
        events: { onSwipeLeft: record('left'), onSwipeRight: record('right') },
        blocks: [{ ...spaces, events: {} }],
      },
    ]),
  });
  const scroll = await layOut({ content: 700, viewport: 400 });
  const release = (x, velocity) =>
    act(async () => {
      fireEvent(scroll, 'scrollEndDrag', {
        nativeEvent: { contentOffset: { x, y: 0 }, velocity: { x: velocity, y: 0 } },
      });
    });
  // Scrolled within the strip: no swipe.
  await release(120, 1.2);
  // Pulled 30pt past the trailing end, then 30pt before the leading one.
  await release(330, 0);
  await release(-30, 0);
  expect(calls.map((call) => call.name)).toEqual(['left', 'right']);
});
