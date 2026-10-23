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
import buildMobileAppEvents from './buildMobileAppEvents.js';
import testContext from '../../test-utils/testContext.js';

function setup(components) {
  const context = testContext();
  context.errors = [];
  context.warnings = [];
  context.typesMapMobile.actions = {
    Link: { package: '@lowdefy/actions-core', version: '7.0.0' },
    SetGlobal: { package: '@lowdefy/actions-core', version: '7.0.0' },
  };
  buildMobileAppEvents({ components, context });
  return { components, context };
}

test('buildMobileAppEvents leaves an app without a mobile key alone', () => {
  const { components, context } = setup({ events: {} });
  expect(components).toEqual({ events: {} });
  expect(context.mobileAppTypeCounters).toBeUndefined();
});

test('buildMobileAppEvents defaults mobile.events to an empty object', () => {
  const { components, context } = setup({ mobile: { pages: [] } });
  expect(components.mobile.events).toEqual({});
  expect(context.mobileAppTypeCounters.actions.getCounts()).toEqual({});
});

test('buildMobileAppEvents throws when mobile.events is not an object', () => {
  expect(() => setup({ mobile: { events: [] } })).toThrow(
    'App "mobile.events" should be an object.'
  );
});

test('buildMobileAppEvents throws on an event name that is not an app event', () => {
  expect(() => setup({ mobile: { events: { onMount: [] } } })).toThrow(
    'Mobile app event "onMount" is not supported. Supported app events: onInit, onInitAsync.'
  );
});

test('buildMobileAppEvents normalizes action lists to try and catch', () => {
  const { components } = setup({
    mobile: { events: { onInit: [{ id: 'set', type: 'SetGlobal', params: { ready: true } }] } },
  });
  expect(components.mobile.events).toEqual({
    onInit: { try: [{ id: 'set', type: 'SetGlobal', params: { ready: true } }], catch: [] },
  });
});

test('buildMobileAppEvents counts types into the mobile counters, not the web ones', () => {
  const { context } = setup({
    mobile: {
      events: { onInit: [{ id: 'set', type: 'SetGlobal', params: { id: { _user: 'id' } } }] },
    },
  });
  expect(context.mobileAppTypeCounters.actions.getCounts()).toEqual({ SetGlobal: 1 });
  expect(context.mobileAppTypeCounters.operators.getCounts()).toEqual({ _user: 1 });
  expect(context.typeCountersMobile.actions.getCounts()).toEqual({ SetGlobal: 1 });
  expect(context.typeCountersMobile.operators.client.getCounts()).toEqual({ _user: 1 });
  expect(context.typeCounters.actions.getCounts()).toEqual({});
  expect(context.typeCounters.operators.client.getCounts()).toEqual({});
});

test('buildMobileAppEvents fails the build for an action type with no native version', () => {
  const { context } = setup({
    mobile: {
      events: {
        onInit: [
          { id: 'analytics', type: 'PostHogInit', '~k': 'k1' },
          { id: 'set', type: 'SetGlobal', params: { ready: true } },
        ],
      },
    },
  });
  expect(context.errors.map((error) => error.message)).toEqual([
    'Action type "PostHogInit" in "mobile.events" has no native version, so a mobile shell cannot run it.',
  ]);
  expect(context.errors[0].configKey).toEqual('k1');
});

test('buildMobileAppEvents throws on page scoped actions', () => {
  expect(() =>
    setup({ mobile: { events: { onInit: [{ id: 'set', type: 'SetState', params: { a: 1 } }] } } })
  ).toThrow('Action "SetState" can not be used in app events.');
});

test('buildMobileAppEvents warns when a Link action targets a page that does not exist', () => {
  const { context } = setup({
    mobile: { events: { onInit: [{ id: 'go', type: 'Link', params: 'missing' }] } },
    pages: [{ pageId: 'home' }],
  });
  expect(context.warnings.map((warning) => warning.message)).toEqual([
    expect.stringContaining('Page "missing" not found.'),
  ]);
});
