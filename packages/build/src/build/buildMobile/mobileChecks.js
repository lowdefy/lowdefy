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

// Small shape checks the mobile feature validators share. Each throws a ConfigError naming the
// config path and the value received. Keys starting with "~" are build markers.

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

function checkArray({ value, path, configKey }) {
  if (!type.isArray(value)) {
    throw new ConfigError(`App "${path}" should be an array.`, { received: value, configKey });
  }
}

function checkString({ value, path, configKey }) {
  if (!type.isString(value) || value === '') {
    throw new ConfigError(`App "${path}" should be a non-empty string.`, {
      received: value,
      configKey,
    });
  }
}

function checkOptionalString({ value, path, configKey }) {
  if (!type.isUndefined(value)) {
    checkString({ value, path, configKey });
  }
}

function checkOptionalBoolean({ value, path, configKey }) {
  if (!type.isUndefined(value) && !type.isBoolean(value)) {
    throw new ConfigError(`App "${path}" should be a boolean.`, { received: value, configKey });
  }
}

function checkOptionalEnum({ value, allowed, path, configKey }) {
  if (!type.isUndefined(value) && !allowed.includes(value)) {
    throw new ConfigError(`App "${path}" should be one of ${allowed.join(', ')}.`, {
      received: value,
      configKey,
    });
  }
}

function checkOptionalNumber({ value, minimum, path, configKey }) {
  if (type.isUndefined(value)) return;
  if (!type.isNumber(value) || value < minimum) {
    throw new ConfigError(`App "${path}" should be a number of ${minimum} or more.`, {
      received: value,
      configKey,
    });
  }
}

// Ids in one list are unique, so the shell can tell its entries apart.
function checkUniqueIds({ items, path, configKey }) {
  const seen = new Set();
  items.forEach((item, index) => {
    if (seen.has(item.id)) {
      throw new ConfigError(`App "${path}[${index}].id" "${item.id}" is used twice.`, {
        configKey: item['~k'] ?? configKey,
      });
    }
    seen.add(item.id);
  });
}

// A page path the shell opens, like "/tasks/42": absolute, with no origin.
function checkOptionalPath({ value, path, configKey }) {
  checkOptionalString({ value, path, configKey });
  if (type.isString(value) && !value.startsWith('/')) {
    throw new ConfigError(`App "${path}" should be a page path starting with "/".`, {
      received: value,
      configKey,
    });
  }
}

export {
  checkArray,
  checkKeys,
  checkObject,
  checkOptionalBoolean,
  checkOptionalEnum,
  checkOptionalNumber,
  checkOptionalPath,
  checkOptionalString,
  checkString,
  checkUniqueIds,
};
