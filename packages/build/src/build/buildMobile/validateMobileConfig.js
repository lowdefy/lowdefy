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

import semver from 'semver';
import { type } from '@lowdefy/helpers';
import { ConfigError } from '@lowdefy/errors';

const MOBILE_KEYS = ['homePageId', 'minShellVersion', 'menus', 'pages', 'shells', 'auth'];
const MENU_KEYS = ['tabs', 'drawer', 'stack'];
const MENU_ITEM_KEYS = ['pageId', 'icon', 'title'];
const SHELL_KEYS = ['id', 'scheme', 'ios', 'android'];
const IOS_KEYS = ['bundleId', 'teamId'];
const ANDROID_KEYS = ['package', 'sha256'];
const AUTH_KEYS = ['emailCode', 'unlock', 'unlockAfter', 'sharedDevice', 'sessionExpiresIn'];
const UNLOCK_MODES = ['none', 'biometric'];

// RFC 3986 scheme syntax. Web schemes are refused: the mobile sign-in page sends
// a one-time sign-in token to <scheme>://auth, which must reach the shell app,
// never a website.
const SCHEME_PATTERN = /^[a-z][a-z0-9+.-]*$/;
const REFUSED_SCHEMES = [
  'about',
  'blob',
  'content',
  'data',
  'file',
  'http',
  'https',
  'intent',
  'javascript',
  'vbscript',
  'ws',
  'wss',
];

// Keys starting with "~" are build markers (~k, ~r, ~l, ~ignoreBuildChecks).
function checkKeys({ object, allowed, path, configKey }) {
  Object.keys(object).forEach((key) => {
    if (key.startsWith('~')) return;
    if (!allowed.includes(key)) {
      throw new ConfigError(
        `App "${path}" has unknown key "${key}". Allowed keys: ${allowed.join(', ')}.`,
        { configKey }
      );
    }
  });
}

function checkObject({ value, path, configKey }) {
  if (!type.isObject(value)) {
    throw new ConfigError(`App "${path}" should be an object.`, { received: value, configKey });
  }
}

function checkOptionalString({ value, path, configKey }) {
  if (!type.isUndefined(value) && !type.isString(value)) {
    throw new ConfigError(`App "${path}" should be a string.`, { received: value, configKey });
  }
}

function validateMenuItems({ items, path, configKey }) {
  if (!type.isArray(items)) {
    throw new ConfigError(`App "${path}" should be an array.`, { received: items, configKey });
  }
  items.forEach((item, index) => {
    const itemPath = `${path}[${index}]`;
    checkObject({ value: item, path: itemPath, configKey });
    const itemConfigKey = item['~k'] ?? configKey;
    checkKeys({ object: item, allowed: MENU_ITEM_KEYS, path: itemPath, configKey: itemConfigKey });
    if (!type.isString(item.pageId)) {
      throw new ConfigError(`App "${itemPath}.pageId" should be a string.`, {
        received: item.pageId,
        configKey: itemConfigKey,
      });
    }
    checkOptionalString({ value: item.icon, path: `${itemPath}.icon`, configKey: itemConfigKey });
    checkOptionalString({ value: item.title, path: `${itemPath}.title`, configKey: itemConfigKey });
  });
}

function validateMenus({ menus, configKey }) {
  checkObject({ value: menus, path: 'mobile.menus', configKey });
  const menusConfigKey = menus['~k'] ?? configKey;
  checkKeys({ object: menus, allowed: MENU_KEYS, path: 'mobile.menus', configKey: menusConfigKey });
  const frames = MENU_KEYS.filter((key) => !type.isUndefined(menus[key]));
  if (frames.length !== 1) {
    throw new ConfigError(
      `App "mobile.menus" should have exactly one of ${MENU_KEYS.join(', ')}. Received ${
        frames.length === 0 ? 'none' : frames.join(', ')
      }.`,
      { configKey: menusConfigKey }
    );
  }
  if (!type.isUndefined(menus.tabs)) {
    validateMenuItems({ items: menus.tabs, path: 'mobile.menus.tabs', configKey: menusConfigKey });
    if (menus.tabs.length < 2 || menus.tabs.length > 5) {
      throw new ConfigError(
        `App "mobile.menus.tabs" should have 2 to 5 items. Received ${menus.tabs.length}.`,
        { configKey: menus.tabs['~k'] ?? menusConfigKey }
      );
    }
  }
  if (!type.isUndefined(menus.drawer)) {
    validateMenuItems({
      items: menus.drawer,
      path: 'mobile.menus.drawer',
      configKey: menusConfigKey,
    });
    if (menus.drawer.length === 0) {
      throw new ConfigError('App "mobile.menus.drawer" should have at least one item.', {
        configKey: menus.drawer['~k'] ?? menusConfigKey,
      });
    }
  }
  if (!type.isUndefined(menus.stack) && menus.stack !== true) {
    throw new ConfigError('App "mobile.menus.stack" should be true.', {
      received: menus.stack,
      configKey: menusConfigKey,
    });
  }
}

function validateShell({ shell, path, configKey }) {
  checkObject({ value: shell, path, configKey });
  const shellConfigKey = shell['~k'] ?? configKey;
  checkKeys({ object: shell, allowed: SHELL_KEYS, path, configKey: shellConfigKey });
  if (!type.isString(shell.id)) {
    throw new ConfigError(`App "${path}.id" should be a string.`, {
      received: shell.id,
      configKey: shellConfigKey,
    });
  }
  checkOptionalString({ value: shell.scheme, path: `${path}.scheme`, configKey: shellConfigKey });
  if (
    type.isString(shell.scheme) &&
    (!SCHEME_PATTERN.test(shell.scheme) || REFUSED_SCHEMES.includes(shell.scheme))
  ) {
    throw new ConfigError(
      `App "${path}.scheme" should be the shell's own URL scheme in lowercase, like "myapp", and not a web scheme.`,
      { received: shell.scheme, configKey: shellConfigKey }
    );
  }
  if (!type.isUndefined(shell.ios)) {
    checkObject({ value: shell.ios, path: `${path}.ios`, configKey: shellConfigKey });
    checkKeys({
      object: shell.ios,
      allowed: IOS_KEYS,
      path: `${path}.ios`,
      configKey: shellConfigKey,
    });
    IOS_KEYS.forEach((key) =>
      checkOptionalString({
        value: shell.ios[key],
        path: `${path}.ios.${key}`,
        configKey: shellConfigKey,
      })
    );
  }
  if (!type.isUndefined(shell.android)) {
    const androidPath = `${path}.android`;
    checkObject({ value: shell.android, path: androidPath, configKey: shellConfigKey });
    checkKeys({
      object: shell.android,
      allowed: ANDROID_KEYS,
      path: androidPath,
      configKey: shellConfigKey,
    });
    checkOptionalString({
      value: shell.android.package,
      path: `${androidPath}.package`,
      configKey: shellConfigKey,
    });
    const { sha256 } = shell.android;
    const validSha256 =
      type.isUndefined(sha256) ||
      type.isString(sha256) ||
      (type.isArray(sha256) && sha256.every((value) => type.isString(value)));
    if (!validSha256) {
      throw new ConfigError(
        `App "${androidPath}.sha256" should be a string or an array of strings.`,
        { received: sha256, configKey: shellConfigKey }
      );
    }
  }
}

function validateShells({ shells, configKey }) {
  if (!type.isArray(shells)) {
    throw new ConfigError('App "mobile.shells" should be an array.', {
      received: shells,
      configKey,
    });
  }
  const shellIds = new Set();
  shells.forEach((shell, index) => {
    const path = `mobile.shells[${index}]`;
    validateShell({ shell, path, configKey });
    if (shellIds.has(shell.id)) {
      throw new ConfigError(`Duplicate mobile shell id "${shell.id}".`, {
        configKey: shell['~k'] ?? configKey,
      });
    }
    shellIds.add(shell.id);
  });
}

function checkOptionalBoolean({ value, path, configKey }) {
  if (!type.isUndefined(value) && !type.isBoolean(value)) {
    throw new ConfigError(`App "${path}" should be a boolean.`, { received: value, configKey });
  }
}

function checkOptionalInteger({ value, path, minimum, configKey }) {
  if (type.isUndefined(value)) {
    return;
  }
  if (!type.isInt(value) || value < minimum) {
    throw new ConfigError(`App "${path}" should be an integer of ${minimum} or more.`, {
      received: value,
      configKey,
    });
  }
}

function validateAuth({ auth, configKey }) {
  checkObject({ value: auth, path: 'mobile.auth', configKey });
  const authConfigKey = auth['~k'] ?? configKey;
  checkKeys({ object: auth, allowed: AUTH_KEYS, path: 'mobile.auth', configKey: authConfigKey });
  checkOptionalBoolean({
    value: auth.emailCode,
    path: 'mobile.auth.emailCode',
    configKey: authConfigKey,
  });
  if (!type.isUndefined(auth.unlock) && !UNLOCK_MODES.includes(auth.unlock)) {
    throw new ConfigError(`App "mobile.auth.unlock" should be one of ${UNLOCK_MODES.join(', ')}.`, {
      received: auth.unlock,
      configKey: authConfigKey,
    });
  }
  checkOptionalInteger({
    value: auth.unlockAfter,
    path: 'mobile.auth.unlockAfter',
    minimum: 0,
    configKey: authConfigKey,
  });
  checkOptionalBoolean({
    value: auth.sharedDevice,
    path: 'mobile.auth.sharedDevice',
    configKey: authConfigKey,
  });
  checkOptionalInteger({
    value: auth.sessionExpiresIn,
    path: 'mobile.auth.sessionExpiresIn',
    minimum: 1,
    configKey: authConfigKey,
  });
}

// The schema check (testSchema) only warns, and a shell cannot open an app
// whose mobile config it does not understand, so the mobile key is checked
// here and an unknown key fails the build.
function validateMobileConfig({ mobile }) {
  checkObject({ value: mobile, path: 'mobile' });
  const configKey = mobile['~k'];
  checkKeys({ object: mobile, allowed: MOBILE_KEYS, path: 'mobile', configKey });
  checkOptionalString({ value: mobile.homePageId, path: 'mobile.homePageId', configKey });
  if (!type.isUndefined(mobile.minShellVersion)) {
    if (!type.isString(mobile.minShellVersion) || semver.valid(mobile.minShellVersion) === null) {
      throw new ConfigError(
        'App "mobile.minShellVersion" should be a semver version, like "7.4.0".',
        { received: mobile.minShellVersion, configKey }
      );
    }
  }
  if (!type.isUndefined(mobile.menus)) {
    validateMenus({ menus: mobile.menus, configKey });
  }
  if (!type.isUndefined(mobile.pages)) {
    if (!type.isArray(mobile.pages)) {
      throw new ConfigError('App "mobile.pages" should be an array.', {
        received: mobile.pages,
        configKey,
      });
    }
    mobile.pages.forEach((page, index) => {
      checkObject({ value: page, path: `mobile.pages[${index}]`, configKey });
    });
  }
  if (!type.isUndefined(mobile.shells)) {
    validateShells({ shells: mobile.shells, configKey });
  }
  if (!type.isUndefined(mobile.auth)) {
    validateAuth({ auth: mobile.auth, configKey });
  }
}

export default validateMobileConfig;
