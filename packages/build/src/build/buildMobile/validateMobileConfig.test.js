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

import validateMobileConfig from './validateMobileConfig.js';

const validMobile = {
  homePageId: 'today',
  minShellVersion: '7.4.0',
  menus: {
    tabs: [
      { pageId: 'today', icon: 'House', title: 'Today' },
      { pageId: 'jobs', title: 'Jobs' },
    ],
  },
  pages: [{ id: 'today', type: 'Box' }],
  shells: [
    {
      id: 'field',
      scheme: 'field',
      ios: { bundleId: 'com.example.field', teamId: 'ABC' },
      android: { package: 'com.example.field', sha256: ['AA', 'BB'] },
    },
  ],
  auth: {},
};

test('validateMobileConfig accepts a complete mobile config', () => {
  expect(() => validateMobileConfig({ mobile: validMobile })).not.toThrow();
});

test('validateMobileConfig accepts an empty mobile config', () => {
  expect(() => validateMobileConfig({ mobile: {} })).not.toThrow();
});

test('validateMobileConfig ignores build marker keys', () => {
  expect(() =>
    validateMobileConfig({ mobile: { '~ignoreBuildChecks': true, '~r': 'r1' } })
  ).not.toThrow();
});

test('validateMobileConfig throws when mobile is not an object', () => {
  expect(() => validateMobileConfig({ mobile: [] })).toThrow('App "mobile" should be an object.');
});

test('validateMobileConfig throws on an unknown key', () => {
  expect(() => validateMobileConfig({ mobile: { serverUrl: 'https://example.com' } })).toThrow(
    'App "mobile" has unknown key "serverUrl". Allowed keys: homePageId, minShellVersion, menus, pages, shells, auth.'
  );
});

test('validateMobileConfig throws when minShellVersion is not semver', () => {
  expect(() => validateMobileConfig({ mobile: { minShellVersion: '7.4' } })).toThrow(
    'App "mobile.minShellVersion" should be a semver version, like "7.4.0".'
  );
});

test('validateMobileConfig throws when menus has no frame', () => {
  expect(() => validateMobileConfig({ mobile: { menus: {} } })).toThrow(
    'App "mobile.menus" should have exactly one of tabs, drawer, stack. Received none.'
  );
});

test('validateMobileConfig throws when menus has two frames', () => {
  expect(() =>
    validateMobileConfig({
      mobile: { menus: { stack: true, drawer: [{ pageId: 'a' }] } },
    })
  ).toThrow(
    'App "mobile.menus" should have exactly one of tabs, drawer, stack. Received drawer, stack.'
  );
});

test('validateMobileConfig throws when tabs has fewer than 2 items', () => {
  expect(() => validateMobileConfig({ mobile: { menus: { tabs: [{ pageId: 'a' }] } } })).toThrow(
    'App "mobile.menus.tabs" should have 2 to 5 items. Received 1.'
  );
});

test('validateMobileConfig throws when tabs has more than 5 items', () => {
  const tabs = ['a', 'b', 'c', 'd', 'e', 'f'].map((pageId) => ({ pageId }));
  expect(() => validateMobileConfig({ mobile: { menus: { tabs } } })).toThrow(
    'App "mobile.menus.tabs" should have 2 to 5 items. Received 6.'
  );
});

test('validateMobileConfig throws when drawer is empty', () => {
  expect(() => validateMobileConfig({ mobile: { menus: { drawer: [] } } })).toThrow(
    'App "mobile.menus.drawer" should have at least one item.'
  );
});

test('validateMobileConfig throws when stack is not true', () => {
  expect(() => validateMobileConfig({ mobile: { menus: { stack: false } } })).toThrow(
    'App "mobile.menus.stack" should be true.'
  );
});

test('validateMobileConfig throws on an unknown menu item key', () => {
  expect(() =>
    validateMobileConfig({
      mobile: { menus: { drawer: [{ pageId: 'a', url: 'https://example.com' }] } },
    })
  ).toThrow(
    'App "mobile.menus.drawer[0]" has unknown key "url". Allowed keys: pageId, icon, title.'
  );
});

test('validateMobileConfig throws when a menu item has no pageId', () => {
  expect(() => validateMobileConfig({ mobile: { menus: { drawer: [{ title: 'A' }] } } })).toThrow(
    'App "mobile.menus.drawer[0].pageId" should be a string.'
  );
});

test('validateMobileConfig throws when a mobile page is not an object', () => {
  expect(() => validateMobileConfig({ mobile: { pages: ['today'] } })).toThrow(
    'App "mobile.pages[0]" should be an object.'
  );
});

test('validateMobileConfig throws on a duplicate shell id', () => {
  expect(() =>
    validateMobileConfig({ mobile: { shells: [{ id: 'field' }, { id: 'field' }] } })
  ).toThrow('Duplicate mobile shell id "field".');
});

test('validateMobileConfig throws on an unknown ios key', () => {
  expect(() =>
    validateMobileConfig({ mobile: { shells: [{ id: 'field', ios: { appId: 'x' } }] } })
  ).toThrow('App "mobile.shells[0].ios" has unknown key "appId". Allowed keys: bundleId, teamId.');
});

test('validateMobileConfig throws when android sha256 is not a string or strings', () => {
  expect(() =>
    validateMobileConfig({ mobile: { shells: [{ id: 'field', android: { sha256: [1] } }] } })
  ).toThrow('App "mobile.shells[0].android.sha256" should be a string or an array of strings.');
});

test('validateMobileConfig throws when auth is not an object', () => {
  expect(() => validateMobileConfig({ mobile: { auth: true } })).toThrow(
    'App "mobile.auth" should be an object.'
  );
});
