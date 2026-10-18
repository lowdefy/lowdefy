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

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { jest } from '@jest/globals';

import validateMobileConfig from './validateMobileConfig.js';

const configDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-mobile-shell-'));
const context = {
  directories: { config: configDirectory },
  handleWarning: jest.fn(),
};

function pngChunk(chunkType, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  // The CRC is not checked by the build.
  return Buffer.concat([length, Buffer.from(chunkType, 'ascii'), data, Buffer.alloc(4)]);
}

function writePng({ name, width = 1024, height = 1024, colorType = 2, transparency = false }) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header.writeUInt8(8, 8);
  header.writeUInt8(colorType, 9);
  const chunks = [pngChunk('IHDR', header)];
  if (transparency) {
    chunks.push(pngChunk('tRNS', Buffer.alloc(6)));
  }
  chunks.push(pngChunk('IDAT', Buffer.alloc(2)), pngChunk('IEND', Buffer.alloc(0)));
  fs.writeFileSync(
    path.join(configDirectory, name),
    Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), ...chunks])
  );
}

writePng({ name: 'icon.png' });
writePng({ name: 'grey.png', colorType: 0 });
writePng({ name: 'small.png', width: 512, height: 512 });
writePng({ name: 'rgba.png', colorType: 6 });
writePng({ name: 'palette.png', colorType: 3 });
writePng({ name: 'transparent.png', transparency: true });
fs.writeFileSync(path.join(configDirectory, 'icon.jpg'), 'not a png');

afterAll(() => {
  fs.rmSync(configDirectory, { recursive: true, force: true });
});

beforeEach(() => {
  context.handleWarning.mockReset();
});

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
  expect(() => validateMobileConfig({ context, mobile: validMobile })).not.toThrow();
});

test('validateMobileConfig accepts an empty mobile config', () => {
  expect(() => validateMobileConfig({ context, mobile: {} })).not.toThrow();
});

test('validateMobileConfig ignores build marker keys', () => {
  expect(() =>
    validateMobileConfig({ context, mobile: { '~ignoreBuildChecks': true, '~r': 'r1' } })
  ).not.toThrow();
});

test('validateMobileConfig throws when mobile is not an object', () => {
  expect(() => validateMobileConfig({ context, mobile: [] })).toThrow(
    'App "mobile" should be an object.'
  );
});

test('validateMobileConfig throws on an unknown key', () => {
  expect(() =>
    validateMobileConfig({ context, mobile: { serverUrl: 'https://example.com' } })
  ).toThrow(
    'App "mobile" has unknown key "serverUrl". Allowed keys: homePageId, minShellVersion, menus, pages, events, shells, auth.'
  );
});

test('validateMobileConfig throws when minShellVersion is not semver', () => {
  expect(() => validateMobileConfig({ context, mobile: { minShellVersion: '7.4' } })).toThrow(
    'App "mobile.minShellVersion" should be a semver version, like "7.4.0".'
  );
});

test('validateMobileConfig throws when menus has no frame', () => {
  expect(() => validateMobileConfig({ context, mobile: { menus: {} } })).toThrow(
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
  expect(() =>
    validateMobileConfig({ context, mobile: { menus: { tabs: [{ pageId: 'a' }] } } })
  ).toThrow('App "mobile.menus.tabs" should have 2 to 5 items. Received 1.');
});

test('validateMobileConfig throws when tabs has more than 5 items', () => {
  const tabs = ['a', 'b', 'c', 'd', 'e', 'f'].map((pageId) => ({ pageId }));
  expect(() => validateMobileConfig({ context, mobile: { menus: { tabs } } })).toThrow(
    'App "mobile.menus.tabs" should have 2 to 5 items. Received 6.'
  );
});

test('validateMobileConfig throws when drawer is empty', () => {
  expect(() => validateMobileConfig({ context, mobile: { menus: { drawer: [] } } })).toThrow(
    'App "mobile.menus.drawer" should have at least one item.'
  );
});

test('validateMobileConfig throws when stack is not true', () => {
  expect(() => validateMobileConfig({ context, mobile: { menus: { stack: false } } })).toThrow(
    'App "mobile.menus.stack" should be true.'
  );
});

test('validateMobileConfig throws on an unknown menu item key', () => {
  expect(() =>
    validateMobileConfig({
      mobile: { menus: { drawer: [{ pageId: 'a', url: 'https://example.com' }] } },
    })
  ).toThrow(
    'App "mobile.menus.drawer[0]" has unknown key "url". Allowed keys: pageId, icon, sfSymbol, title, role.'
  );
});

test('validateMobileConfig throws when a menu item has no pageId', () => {
  expect(() =>
    validateMobileConfig({ context, mobile: { menus: { drawer: [{ title: 'A' }] } } })
  ).toThrow('App "mobile.menus.drawer[0].pageId" should be a string.');
});

test('validateMobileConfig throws when a mobile page is not an object', () => {
  expect(() => validateMobileConfig({ context, mobile: { pages: ['today'] } })).toThrow(
    'App "mobile.pages[0]" should be an object.'
  );
});

test('validateMobileConfig throws on a duplicate shell id', () => {
  expect(() =>
    validateMobileConfig({ context, mobile: { shells: [{ id: 'field' }, { id: 'field' }] } })
  ).toThrow('Duplicate mobile shell id "field".');
});

test('validateMobileConfig throws on an unknown ios key', () => {
  expect(() =>
    validateMobileConfig({ context, mobile: { shells: [{ id: 'field', ios: { appId: 'x' } }] } })
  ).toThrow('App "mobile.shells[0].ios" has unknown key "appId". Allowed keys: bundleId, teamId.');
});

test('validateMobileConfig throws when android sha256 is not a string or strings', () => {
  expect(() =>
    validateMobileConfig({
      context,
      mobile: { shells: [{ id: 'field', android: { sha256: [1] } }] },
    })
  ).toThrow('App "mobile.shells[0].android.sha256" should be a string or an array of strings.');
});

test('validateMobileConfig throws when auth is not an object', () => {
  expect(() => validateMobileConfig({ context, mobile: { auth: true } })).toThrow(
    'App "mobile.auth" should be an object.'
  );
});

test('validateMobileConfig accepts a complete mobile.auth', () => {
  expect(() =>
    validateMobileConfig({
      mobile: {
        auth: {
          emailCode: false,
          unlock: 'biometric',
          unlockAfter: 0,
          sharedDevice: true,
          sessionExpiresIn: 2592000,
        },
      },
    })
  ).not.toThrow();
});

test('validateMobileConfig throws on an unknown mobile.auth key', () => {
  expect(() => validateMobileConfig({ context, mobile: { auth: { refreshToken: true } } })).toThrow(
    'App "mobile.auth" has unknown key "refreshToken". Allowed keys: emailCode, unlock, unlockAfter, sharedDevice, sessionExpiresIn.'
  );
});

test.each([
  [{ emailCode: 'yes' }, 'App "mobile.auth.emailCode" should be a boolean.'],
  [{ unlock: 'pin' }, 'App "mobile.auth.unlock" should be one of none, biometric.'],
  [{ unlockAfter: -1 }, 'App "mobile.auth.unlockAfter" should be an integer of 0 or more.'],
  [{ unlockAfter: 1.5 }, 'App "mobile.auth.unlockAfter" should be an integer of 0 or more.'],
  [{ sharedDevice: 1 }, 'App "mobile.auth.sharedDevice" should be a boolean.'],
  [
    { sessionExpiresIn: 0 },
    'App "mobile.auth.sessionExpiresIn" should be an integer of 1 or more.',
  ],
  [
    { sessionExpiresIn: '30d' },
    'App "mobile.auth.sessionExpiresIn" should be an integer of 1 or more.',
  ],
])('validateMobileConfig refuses mobile.auth %j', (auth, message) => {
  expect(() => validateMobileConfig({ context, mobile: { auth } })).toThrow(message);
});

test.each([
  ['https'],
  ['http'],
  ['javascript'],
  ['intent'],
  ['wss'],
  ['My App'],
  ['MyApp'],
  ['1app'],
])('validateMobileConfig refuses the shell scheme "%s"', (scheme) => {
  expect(() =>
    validateMobileConfig({ context, mobile: { shells: [{ id: 'field', scheme }] } })
  ).toThrow(
    'App "mobile.shells[0].scheme" should be the shell\'s own URL scheme in lowercase, like "myapp", and not a web scheme.'
  );
});

test('validateMobileConfig accepts a reverse-domain shell scheme', () => {
  expect(() =>
    validateMobileConfig({
      context,
      mobile: { shells: [{ id: 'field', scheme: 'com.example.field' }] },
    })
  ).not.toThrow();
});

const storeShell = {
  id: 'field',
  name: 'Field',
  icon: 'icon.png',
  color: '#0B5FFF',
  profile: 'field',
  version: '1.4',
  scheme: 'field',
  distribution: 'private',
  eas: { owner: 'example', projectId: '2b6f0000-0000-0000-0000-000000000000' },
  ios: { bundleId: 'com.example.field', teamId: 'ABCDE12345' },
  android: { package: 'com.example.field', sha256: ['AA:BB'] },
};

function validateShells(shells) {
  return validateMobileConfig({ context, mobile: { shells } });
}

test('validateMobileConfig accepts a shell with every store field', () => {
  expect(() => validateShells([storeShell])).not.toThrow();
  expect(context.handleWarning).not.toHaveBeenCalled();
});

test('validateMobileConfig accepts a greyscale icon', () => {
  expect(() => validateShells([{ ...storeShell, icon: 'grey.png' }])).not.toThrow();
});

test.each([['basic'], ['field'], ['field-nfc'], ['field-tracking']])(
  'validateMobileConfig accepts the shell profile "%s"',
  (profile) => {
    expect(() => validateShells([{ ...storeShell, profile }])).not.toThrow();
  }
);

test.each([['private'], ['store'], ['internal']])(
  'validateMobileConfig accepts the shell distribution "%s"',
  (distribution) => {
    expect(() => validateShells([{ ...storeShell, distribution }])).not.toThrow();
  }
);

test.each([
  [
    'a missing icon file',
    { icon: 'missing.png' },
    'App "mobile.shells[0].icon" file "missing.png" does not exist. The path is relative to the config directory.',
  ],
  [
    'an icon that is not a PNG',
    { icon: 'icon.jpg' },
    'App "mobile.shells[0].icon" file "icon.jpg" should be a PNG.',
  ],
  [
    'a 512 px icon',
    { icon: 'small.png' },
    'App "mobile.shells[0].icon" file "small.png" should be 1024×1024 pixels. Received 512×512.',
  ],
  [
    'an RGBA icon',
    { icon: 'rgba.png' },
    'App "mobile.shells[0].icon" file "rgba.png" should have no alpha channel or transparency. Save it as an RGB PNG without alpha.',
  ],
  [
    'a palette icon',
    { icon: 'palette.png' },
    'App "mobile.shells[0].icon" file "palette.png" should have no alpha channel or transparency. Save it as an RGB PNG without alpha.',
  ],
  [
    'an RGB icon with a tRNS chunk',
    { icon: 'transparent.png' },
    'App "mobile.shells[0].icon" file "transparent.png" should have no alpha channel or transparency. Save it as an RGB PNG without alpha.',
  ],
  ['an icon that is not a string', { icon: 1 }, 'App "mobile.shells[0].icon" should be a string.'],
  ['a name that is not a string', { name: 1 }, 'App "mobile.shells[0].name" should be a string.'],
  [
    'a bad bundle id',
    { ios: { bundleId: 'field_app', teamId: 'T' } },
    'App "mobile.shells[0].ios.bundleId" should be a reverse-DNS bundle id of letters, digits and hyphens, like "com.example.app".',
  ],
  [
    'a bundle id with an underscore',
    { ios: { bundleId: 'com.example.field_app' } },
    'App "mobile.shells[0].ios.bundleId" should be a reverse-DNS bundle id',
  ],
  [
    'a bad package',
    { android: { package: 'com.example.field-app', sha256: 'AA' } },
    'App "mobile.shells[0].android.package" should be a reverse-DNS package name whose segments start with a letter and hold only letters, digits and underscores, like "com.example.app".',
  ],
  [
    'a package segment starting with a digit',
    { android: { package: 'com.1example.field', sha256: 'AA' } },
    'App "mobile.shells[0].android.package" should be a reverse-DNS package name',
  ],
  [
    'a package with one segment',
    { android: { package: 'field', sha256: 'AA' } },
    'App "mobile.shells[0].android.package" should be a reverse-DNS package name',
  ],
  [
    'a three-part version',
    { version: '1.4.0' },
    'App "mobile.shells[0].version" should be "major.minor", like "1.4" (the patch is raised by each native build).',
  ],
  ['a numeric version', { version: 1.4 }, 'App "mobile.shells[0].version" should be a string.'],
  [
    'an unknown profile',
    { profile: 'everything' },
    'App "mobile.shells[0].profile" should be one of basic, field, field-nfc, field-tracking.',
  ],
  [
    'an unknown distribution',
    { distribution: 'public' },
    'App "mobile.shells[0].distribution" should be one of private, store, internal.',
  ],
  [
    'a colour that is not #RRGGBB',
    { color: 'blue' },
    'App "mobile.shells[0].color" should be a colour like "#0B5FFF".',
  ],
  [
    'an unknown eas key',
    { eas: { owner: 'example', slug: 'field' } },
    'App "mobile.shells[0].eas" has unknown key "slug". Allowed keys: owner, projectId.',
  ],
  [
    'an eas projectId that is not a string',
    { eas: { projectId: 1 } },
    'App "mobile.shells[0].eas.projectId" should be a string.',
  ],
  [
    'an extra key',
    { bundleId: 'com.example.field' },
    'App "mobile.shells[0]" has unknown key "bundleId". Allowed keys: id, name, icon, color, profile, version, scheme, distribution, eas, ios, android.',
  ],
])('validateMobileConfig refuses a shell with %s', (_, fields, message) => {
  expect(() => validateShells([{ ...storeShell, ...fields }])).toThrow(message);
});

test('validateMobileConfig warns when a shell has no android.sha256', () => {
  expect(() =>
    validateShells([{ ...storeShell, android: { package: 'com.example.field' }, '~k': 'k1' }])
  ).not.toThrow();
  expect(context.handleWarning).toHaveBeenCalledTimes(1);
  const warning = context.handleWarning.mock.calls[0][0];
  expect(warning.message).toBe(
    'Mobile shell "field" has no "android.sha256", so sign-in by sheet will not work on Android. After the first Android upload, copy the app signing key\'s SHA-256 from Play Console into "mobile.shells[0].android.sha256" and deploy the server (see "lowdefy mobile checklist").'
  );
  expect(warning.configKey).toBe('k1');
});

test('validateMobileConfig warns when an iOS-only shell has no android.sha256', () => {
  validateShells([{ id: 'field', ios: { bundleId: 'com.example.field' } }]);
  expect(context.handleWarning).toHaveBeenCalledTimes(1);
});

test('validateMobileConfig does not warn for a shell with neither ios nor android', () => {
  validateShells([{ id: 'field', scheme: 'field' }]);
  expect(context.handleWarning).not.toHaveBeenCalled();
});

test('validateMobileConfig accepts a tab with sfSymbol and one search tab', () => {
  const menus = {
    tabs: [
      { pageId: 'today', icon: 'Inbox', sfSymbol: 'tray.full' },
      { pageId: 'find', role: 'search', title: 'Search' },
    ],
  };
  expect(() => validateMobileConfig({ context, mobile: { menus } })).not.toThrow();
});

test('validateMobileConfig throws on a tab role other than search', () => {
  const menus = { tabs: [{ pageId: 'today' }, { pageId: 'find', role: 'favorites' }] };
  expect(() => validateMobileConfig({ context, mobile: { menus } })).toThrow(
    'App "mobile.menus.tabs[1].role" should be one of: search. Received "favorites".'
  );
});

test('validateMobileConfig throws on two search tabs', () => {
  const menus = {
    tabs: [
      { pageId: 'a', role: 'search' },
      { pageId: 'b', role: 'search' },
    ],
  };
  expect(() => validateMobileConfig({ context, mobile: { menus } })).toThrow(
    'App "mobile.menus.tabs" should have at most one item with role "search".'
  );
});

test('validateMobileConfig throws on a drawer item with a role', () => {
  const menus = { drawer: [{ pageId: 'find', role: 'search' }] };
  expect(() => validateMobileConfig({ context, mobile: { menus } })).toThrow(
    'App "mobile.menus.drawer[0].role" should be one of: none. Received "search".'
  );
});

test('validateMobileConfig throws when a menu item sfSymbol is not a string', () => {
  const menus = { tabs: [{ pageId: 'a', sfSymbol: 3 }, { pageId: 'b' }] };
  expect(() => validateMobileConfig({ context, mobile: { menus } })).toThrow(
    'App "mobile.menus.tabs[0].sfSymbol" should be a string.'
  );
});
