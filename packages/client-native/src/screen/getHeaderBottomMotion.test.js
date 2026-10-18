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

import { Animated } from 'react-native';

import getHeaderBottomMotion from './getHeaderBottomMotion.js';

function valuesAt({ headerInset, scrollY, offset }) {
  scrollY.setValue(offset);
  const motion = getHeaderBottomMotion({ cover: 1000, headerInset, scrollY });
  return { opacity: motion.pinnedOpacity.__getValue(), y: motion.translateY.__getValue() };
}

test('getHeaderBottomMotion leaves the strip in place until the page scrolls past the header', () => {
  const scrollY = new Animated.Value(0);
  // Under a 100pt header the page rests at -100, and pulls down further to refresh.
  expect(valuesAt({ headerInset: 100, offset: -100, scrollY })).toEqual({ opacity: 0, y: 0 });
  expect(valuesAt({ headerInset: 100, offset: -180, scrollY })).toEqual({ opacity: 0, y: 0 });
});

test('getHeaderBottomMotion pins the strip under the header, fading its surface in', () => {
  const scrollY = new Animated.Value(0);
  expect(valuesAt({ headerInset: 100, offset: -97, scrollY })).toEqual({ opacity: 0.5, y: 3 });
  expect(valuesAt({ headerInset: 100, offset: 240, scrollY })).toEqual({ opacity: 1, y: 340 });
});

test('getHeaderBottomMotion follows a header height that changes as a large title collapses', () => {
  const scrollY = new Animated.Value(-150);
  const headerInset = new Animated.Value(150);
  const motion = getHeaderBottomMotion({ cover: 1000, headerInset, scrollY });
  // The large title collapses with the scroll: the bar's edge stays at the page's top.
  scrollY.setValue(-120);
  headerInset.setValue(120);
  expect(motion.translateY.__getValue()).toBe(0);
  // Collapsed to a 98pt bar, the page scrolls on under it.
  scrollY.setValue(-40);
  headerInset.setValue(98);
  expect(motion.translateY.__getValue()).toBe(58);
});

test('getHeaderBottomMotion pins at the top of a page that sits below the header', () => {
  const scrollY = new Animated.Value(0);
  expect(valuesAt({ headerInset: 0, offset: 0, scrollY })).toEqual({ opacity: 0, y: 0 });
  expect(valuesAt({ headerInset: 0, offset: 30, scrollY })).toEqual({ opacity: 1, y: 30 });
});

test('getHeaderBottomMotion places the page tint in the pinned surface where the page draws it', () => {
  const headerInset = new Animated.Value(150);
  const motion = getHeaderBottomMotion({
    cover: 1000,
    headerInset,
    scrollY: new Animated.Value(0),
  });
  // The surface's top is 1000pt above the strip, pinned at the bar's 150pt edge.
  expect(motion.tintOffset.__getValue()).toBe(850);
  headerInset.setValue(98);
  expect(motion.tintOffset.__getValue()).toBe(902);
  const below = getHeaderBottomMotion({ cover: 1000, headerInset: 0, scrollY: 0 });
  expect(below.tintOffset.__getValue()).toBe(1000);
});

test('getHeaderBottomMotion places the page tint by where the strip is on screen, pinned or not', () => {
  const scrollY = new Animated.Value(-100);
  const motion = getHeaderBottomMotion({ cover: 1000, headerInset: 100, scrollY });
  // At rest under a 100pt bar, the strip's top is 100pt down the screen.
  expect(motion.tintOffset.__getValue()).toBe(900);
  // Pulled down 80pt to refresh, it rides down with the content.
  scrollY.setValue(-180);
  expect(motion.tintOffset.__getValue()).toBe(820);
  // Scrolled on, it stays pinned under the bar.
  scrollY.setValue(240);
  expect(motion.tintOffset.__getValue()).toBe(900);
});
