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

import buildMobile from './buildMobile.js';

test('buildMobile defaults mobile to an empty normalized object when not defined', () => {
  const components = {};
  buildMobile({ components });
  expect(components.mobile).toEqual({
    config: {},
    theme: {},
    capacitor: {},
    pages: [],
    menus: [],
  });
});

test('buildMobile throws when mobile is not an object', () => {
  const components = { mobile: 'mobile' };
  expect(() => buildMobile({ components })).toThrow('lowdefy.mobile is not an object.');
});

test('buildMobile throws when mobile.shell is defined', () => {
  const components = { mobile: { shell: {} } };
  expect(() => buildMobile({ components })).toThrow(
    'App "mobile.shell" is reserved and not supported in this version of Lowdefy.'
  );
});

test('buildMobile accepts a valid reverse-DNS appId', () => {
  const components = { mobile: { appId: 'com.acme.tracker' } };
  buildMobile({ components });
  expect(components.mobile.appId).toEqual('com.acme.tracker');
});

test('buildMobile throws when appId is not reverse-DNS', () => {
  const components = { mobile: { appId: 'tracker' } };
  expect(() => buildMobile({ components })).toThrow(
    'App "mobile.appId" should be a reverse-DNS identifier'
  );
});

test('buildMobile throws when appId is not a string', () => {
  const components = { mobile: { appId: 7 } };
  expect(() => buildMobile({ components })).toThrow('App "mobile.appId" should be a string.');
});

test('buildMobile throws when name is not a string', () => {
  const components = { mobile: { name: {} } };
  expect(() => buildMobile({ components })).toThrow('App "mobile.name" should be a string.');
});

test('buildMobile throws when serverUrl is not a string', () => {
  const components = { mobile: { serverUrl: 7 } };
  expect(() => buildMobile({ components })).toThrow('App "mobile.serverUrl" should be a string.');
});

test('buildMobile throws when theme values are not strings', () => {
  const components = { mobile: { theme: { '--adm-color-primary': { color: 'blue' } } } };
  expect(() => buildMobile({ components })).toThrow(
    'App "mobile.theme" values should be CSS variable strings.'
  );
});

test('buildMobile accepts theme with dark object', () => {
  const components = {
    mobile: {
      theme: {
        '--adm-color-primary': '#1677ff',
        dark: { '--adm-color-background': '#000000' },
      },
    },
  };
  buildMobile({ components });
  expect(components.mobile.theme.dark).toEqual({ '--adm-color-background': '#000000' });
});

test('buildMobile throws when theme.dark is not an object', () => {
  const components = { mobile: { theme: { dark: 'black' } } };
  expect(() => buildMobile({ components })).toThrow('App "mobile.theme.dark" should be an object.');
});

test('buildMobile throws when pages is not an array', () => {
  const components = { mobile: { pages: {} } };
  expect(() => buildMobile({ components })).toThrow('App "mobile.pages" should be an array.');
});

test('buildMobile throws when menus is not an array', () => {
  const components = { mobile: { menus: {} } };
  expect(() => buildMobile({ components })).toThrow('App "mobile.menus" should be an array.');
});

test('buildMobile throws when capacitor is not an object', () => {
  const components = { mobile: { capacitor: [] } };
  expect(() => buildMobile({ components })).toThrow('App "mobile.capacitor" should be an object.');
});
