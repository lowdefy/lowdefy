/* eslint-disable no-param-reassign */

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

import { type } from '@lowdefy/helpers';
import { ConfigError } from '@lowdefy/errors';

// Reverse-DNS: at least two dot-separated segments, each starting with a letter.
const appIdRegex = /^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z][a-zA-Z0-9_]*)+$/;

function validateThemeVariables({ theme, configKey }) {
  Object.entries(theme).forEach(([key, value]) => {
    if (key === 'dark' || key.startsWith('~')) return;
    if (!type.isString(value) && !type.isNumber(value)) {
      throw new ConfigError(
        `App "mobile.theme" values should be CSS variable strings. Received ${JSON.stringify(
          value
        )} at "${key}".`,
        { configKey }
      );
    }
  });
}

function buildMobile({ components }) {
  // Configured means the app has a mobile key — the mobile bundle artifacts
  // (plugin imports, theme) are only populated for configured apps, while
  // config.json and menus.json are always written for /api/root?target=mobile.
  const configured = !type.isNone(components.mobile);
  if (type.isNone(components.mobile)) {
    components.mobile = {};
  }
  if (!type.isObject(components.mobile)) {
    throw new ConfigError('lowdefy.mobile is not an object.', {
      received: components.mobile,
    });
  }
  const mobile = components.mobile;
  mobile.configured = configured;
  const configKey = mobile['~k'];

  // Reserved for the app-shell design — reject now so configs stay forward-compatible.
  if (!type.isUndefined(mobile.shell)) {
    throw new ConfigError(
      'App "mobile.shell" is reserved and not supported in this version of Lowdefy.',
      { configKey }
    );
  }

  if (!type.isNone(mobile.appId)) {
    if (!type.isString(mobile.appId)) {
      throw new ConfigError('App "mobile.appId" should be a string.', {
        received: mobile.appId,
        configKey,
      });
    }
    if (!appIdRegex.test(mobile.appId)) {
      throw new ConfigError(
        `App "mobile.appId" should be a reverse-DNS identifier (e.g. "com.acme.tracker"). Received ${JSON.stringify(
          mobile.appId
        )}.`,
        { configKey }
      );
    }
  }
  if (!type.isNone(mobile.name) && !type.isString(mobile.name)) {
    throw new ConfigError('App "mobile.name" should be a string.', {
      received: mobile.name,
      configKey,
    });
  }
  if (!type.isNone(mobile.serverUrl) && !type.isString(mobile.serverUrl)) {
    throw new ConfigError('App "mobile.serverUrl" should be a string.', {
      received: mobile.serverUrl,
      configKey,
    });
  }

  if (type.isNone(mobile.config)) {
    mobile.config = {};
  }
  if (!type.isObject(mobile.config)) {
    throw new ConfigError('App "mobile.config" should be an object.', {
      received: mobile.config,
      configKey,
    });
  }
  if (type.isNone(mobile.theme)) {
    mobile.theme = {};
  }
  if (!type.isObject(mobile.theme)) {
    throw new ConfigError('App "mobile.theme" should be an object.', {
      received: mobile.theme,
      configKey,
    });
  }
  validateThemeVariables({ theme: mobile.theme, configKey });
  if (!type.isNone(mobile.theme.dark)) {
    if (!type.isObject(mobile.theme.dark)) {
      throw new ConfigError('App "mobile.theme.dark" should be an object.', {
        received: mobile.theme.dark,
        configKey,
      });
    }
    validateThemeVariables({ theme: mobile.theme.dark, configKey });
  }
  if (type.isNone(mobile.capacitor)) {
    mobile.capacitor = {};
  }
  if (!type.isObject(mobile.capacitor)) {
    throw new ConfigError('App "mobile.capacitor" should be an object.', {
      received: mobile.capacitor,
      configKey,
    });
  }
  if (type.isNone(mobile.pages)) {
    mobile.pages = [];
  }
  if (!type.isArray(mobile.pages)) {
    throw new ConfigError('App "mobile.pages" should be an array.', {
      received: mobile.pages,
      configKey,
    });
  }
  if (type.isNone(mobile.menus)) {
    mobile.menus = [];
  }
  if (!type.isArray(mobile.menus)) {
    throw new ConfigError('App "mobile.menus" should be an array.', {
      received: mobile.menus,
      configKey,
    });
  }

  return components;
}

export default buildMobile;
