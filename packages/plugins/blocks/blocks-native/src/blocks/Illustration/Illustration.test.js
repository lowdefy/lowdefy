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

import { jest } from '@jest/globals';
import { Animated, processColor } from 'react-native';
import { act } from '@testing-library/react-native';

import {
  findAllOfType,
  ios,
  page,
  renderPage,
  screen,
  styleOf,
  theme,
} from '../../test/renderPage.js';

// A drawing without a title is hidden from screen readers, and so from default queries.
const HIDDEN = { includeHiddenElements: true };

const SVG = `<svg viewBox="0 0 40 20">
  <rect width="40" height="4" y="16" fill="var(--ground)"/>
  <g id="bird" fill="var(--colorLabel)">
    <path d="M10 8h8v8h-8z"/>
    <path id="eye" d="M15 10h2v2h-2z" fill="var(--eye)"/>
  </g>
</svg>`;

const ANIMATIONS = [
  {
    target: 'bird',
    property: 'translateY',
    easing: 'step',
    duration: 4000,
    keyframes: [
      { at: 0, value: 0 },
      { at: 0.5, value: -2 },
    ],
  },
  {
    target: 'eye',
    property: 'opacity',
    easing: 'step',
    duration: 4000,
    keyframes: [
      { at: 0, value: 1 },
      { at: 0.9, value: 0 },
    ],
  },
];

function art(properties) {
  return {
    id: 'art',
    type: 'Illustration',
    properties: {
      svg: SVG,
      width: 80,
      colors: { ground: 'green', eye: '#FFFFFF' },
      colorsDark: { eye: '#111111' },
      ...properties,
    },
  };
}

test('Illustration draws its markup in a box of the viewBox aspect ratio, hidden from screen readers', async () => {
  await renderPage({ pageConfig: page([art()]) });
  const box = await screen.findByTestId('art_illustration', HIDDEN);
  expect(styleOf(box)).toMatchObject({ height: 40, width: 80 });
  expect(box.props.pointerEvents).toBe('none');
  expect(box.props.importantForAccessibility).toBe('no-hide-descendants');
  expect(box.props.accessibilityElementsHidden).toBe(true);
  // No animations: one SVG of the whole drawing.
  expect(findAllOfType(box, 'RNSVGSvgView')).toHaveLength(1);
  expect(findAllOfType(box, 'RNSVGRect')).toHaveLength(1);
  expect(findAllOfType(box, 'RNSVGPath')).toHaveLength(2);
});

test('Illustration draws each animated element in a view of its own, the eye inside the bird', async () => {
  await renderPage({ pageConfig: page([art({ animations: ANIMATIONS })]) });
  const box = await screen.findByTestId('art_illustration', HIDDEN);
  const bird = screen.getByTestId('art_bird', HIDDEN);
  const eye = screen.getByTestId('art_eye', HIDDEN);
  // The ground, the bird's body and the eye are drawn in three SVGs.
  expect(findAllOfType(box, 'RNSVGSvgView')).toHaveLength(3);
  expect(findAllOfType(bird, 'RNSVGSvgView')).toHaveLength(2);
  expect(findAllOfType(eye, 'RNSVGSvgView')).toHaveLength(1);
  // The bird starts at its first keyframe; translations are in drawing units, two points each.
  expect(styleOf(bird).transform).toEqual([{ translateY: 0 }]);
  expect(styleOf(bird).transformOrigin).toEqual([40, 20, 0]);
  expect(styleOf(eye).opacity).toBe(1);
  await act(() => new Promise((resolve) => setTimeout(resolve, 50)));
});

test('Illustration colours var references from colors, palette hues and theme tokens', async () => {
  await renderPage({ pageConfig: page([art()]) });
  const box = await screen.findByTestId('art_illustration', HIDDEN);
  const [ground] = findAllOfType(box, 'RNSVGRect');
  // The SVG's own root group, then the bird's.
  const [, bird] = findAllOfType(box, 'RNSVGGroup');
  const [, eye] = findAllOfType(box, 'RNSVGPath');
  expect(ground.props.fill.payload).toEqual(processColor(theme.light['green-6']));
  expect(bird.props.fill.payload).toEqual(processColor(ios.light.colorLabel));
  expect(eye.props.fill.payload).toEqual(processColor('#FFFFFF'));
});

test('Illustration takes colorsDark over colors in dark mode', async () => {
  await renderPage({ darkMode: 'dark', pageConfig: page([art()]) });
  const box = await screen.findByTestId('art_illustration', HIDDEN);
  // The SVG's own root group, then the bird's.
  const [, bird] = findAllOfType(box, 'RNSVGGroup');
  const [, eye] = findAllOfType(box, 'RNSVGPath');
  expect(bird.props.fill.payload).toEqual(processColor(ios.dark.colorLabel));
  expect(eye.props.fill.payload).toEqual(processColor('#111111'));
});

test('Illustration with a position sits absolutely at its offsets, taking no room', async () => {
  await renderPage({
    pageConfig: page([art({ height: 30, position: { bottom: -24, right: 0 }, title: 'A bird' })]),
  });
  const box = await screen.findByTestId('art_illustration', HIDDEN);
  expect(styleOf(box)).toMatchObject({
    bottom: -24,
    height: 30,
    position: 'absolute',
    right: 0,
    width: 80,
  });
  expect(box.props.accessible).toBe(true);
  expect(box.props.accessibilityLabel).toBe('A bird');
  expect(box.props.accessibilityRole).toBe('image');
});

test('Illustration runs its animations on the native driver, one clock per duration, delay and loop', async () => {
  const timing = jest.spyOn(Animated, 'timing');
  await renderPage({
    pageConfig: page([
      art({
        animations: [
          ...ANIMATIONS,
          { ...ANIMATIONS[1], target: 'bird', property: 'scale', delay: 500 },
        ],
      }),
    ]),
  });
  await screen.findByTestId('art_bird', HIDDEN);
  const clocks = timing.mock.calls.filter(([, config]) => config.duration === 4000);
  expect(clocks).toHaveLength(2);
  clocks.forEach(([, config]) => {
    expect(config).toMatchObject({ toValue: 1, useNativeDriver: true });
  });
  timing.mockRestore();
});
