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

import { expect, test } from 'vitest';
import buildMobileTheme from './buildMobileTheme.js';
import testContext from '../../test-utils/testContext.js';

test('buildMobileTheme computes light and dark tokens for a custom primary colour', () => {
  const context = testContext();
  buildMobileTheme({
    components: {
      mobile: {},
      theme: { antd: { token: { colorPrimary: '#6366f1' } }, darkMode: 'dark' },
    },
    context,
  });
  const { darkMode, light, dark } = context.mobileTheme;
  expect(darkMode).toBe('dark');
  expect(light.colorPrimary).toBe('#6366f1');
  expect(light.colorBgContainer).toBe('#ffffff');
  // antd's dark algorithm derives a darker primary and dark surfaces.
  expect(dark.colorPrimary).not.toBe('#6366f1');
  expect(dark.colorPrimary).toMatch(/^#[0-9a-f]{6}$/);
  expect(dark.colorBgContainer).toBe('#141414');
  expect(light.borderRadius).toBe(6);
});

test('buildMobileTheme lays each mode token over the shared token', () => {
  const context = testContext();
  buildMobileTheme({
    components: {
      mobile: {},
      theme: {
        antd: {
          token: { colorPrimary: '#6366f1', borderRadius: 10 },
          lightToken: { colorBgLayout: '#fafafa' },
          darkToken: { colorBgLayout: '#0f1117' },
        },
      },
    },
    context,
  });
  expect(context.mobileTheme.darkMode).toBe('system');
  expect(context.mobileTheme.light.colorBgLayout).toBe('#fafafa');
  expect(context.mobileTheme.dark.colorBgLayout).toBe('#0f1117');
  expect(context.mobileTheme.light.borderRadius).toBe(10);
  expect(context.mobileTheme.dark.borderRadius).toBe(10);
});

test('buildMobileTheme takes dark out of the light algorithm and keeps compact', () => {
  const context = testContext();
  buildMobileTheme({
    components: { mobile: {}, theme: { antd: { algorithm: ['dark', 'compact'] } } },
    context,
  });
  const { light, dark } = context.mobileTheme;
  expect(light.colorBgContainer).toBe('#ffffff');
  expect(dark.colorBgContainer).toBe('#141414');
  // compact shrinks control heights in both modes.
  expect(light.controlHeight).toBeLessThan(32);
  expect(dark.controlHeight).toBe(light.controlHeight);
});

test('buildMobileTheme leaves an empty theme for an app without a mobile key', () => {
  const context = testContext();
  buildMobileTheme({ components: { theme: { antd: { token: {} } } }, context });
  expect(context.mobileTheme).toEqual({});
});
