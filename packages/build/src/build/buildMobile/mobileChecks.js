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

import collectExceptions from '../../utils/collectExceptions.js';

// Small shape checks the mobile feature validators share. Each collects a ConfigError naming the
// config path and the value received, so one build reports every mobile error, and returns
// whether the value passed: a caller stops at a value that is not the object or array it reads
// further. Keys starting with "~" are build markers.

function checkKeys({ object, allowed, path, configKey, context }) {
  let valid = true;
  Object.keys(object).forEach((key) => {
    if (key.startsWith('~')) return;
    if (!allowed.includes(key)) {
      valid = false;
      collectExceptions(
        context,
        new ConfigError(
          `App "${path}" has unknown key "${key}". Allowed keys: ${allowed.join(', ')}.`,
          { configKey }
        )
      );
    }
  });
  return valid;
}

function checkObject({ value, path, configKey, context }) {
  if (!type.isObject(value)) {
    collectExceptions(
      context,
      new ConfigError(`App "${path}" should be an object.`, { received: value, configKey })
    );
    return false;
  }
  return true;
}

function checkArray({ value, path, configKey, context }) {
  if (!type.isArray(value)) {
    collectExceptions(
      context,
      new ConfigError(`App "${path}" should be an array.`, { received: value, configKey })
    );
    return false;
  }
  return true;
}

function checkString({ value, path, configKey, context }) {
  if (!type.isString(value) || value === '') {
    collectExceptions(
      context,
      new ConfigError(`App "${path}" should be a non-empty string.`, {
        received: value,
        configKey,
      })
    );
    return false;
  }
  return true;
}

function checkOptionalString({ value, path, configKey, context }) {
  if (type.isUndefined(value)) {
    return true;
  }
  return checkString({ value, path, configKey, context });
}

function checkOptionalBoolean({ value, path, configKey, context }) {
  if (!type.isUndefined(value) && !type.isBoolean(value)) {
    collectExceptions(
      context,
      new ConfigError(`App "${path}" should be a boolean.`, { received: value, configKey })
    );
    return false;
  }
  return true;
}

function checkOptionalEnum({ value, allowed, path, configKey, context }) {
  if (!type.isUndefined(value) && !allowed.includes(value)) {
    collectExceptions(
      context,
      new ConfigError(`App "${path}" should be one of ${allowed.join(', ')}.`, {
        received: value,
        configKey,
      })
    );
    return false;
  }
  return true;
}

function checkOptionalNumber({ value, minimum, path, configKey, context }) {
  if (type.isUndefined(value)) {
    return true;
  }
  if (!type.isNumber(value) || value < minimum) {
    collectExceptions(
      context,
      new ConfigError(`App "${path}" should be a number of ${minimum} or more.`, {
        received: value,
        configKey,
      })
    );
    return false;
  }
  return true;
}

// Ids in one list are unique, so the shell can tell its entries apart. The items are objects: a
// caller checks them first.
function checkUniqueIds({ items, path, configKey, context }) {
  const seen = new Set();
  let valid = true;
  items.forEach((item, index) => {
    if (seen.has(item.id)) {
      valid = false;
      collectExceptions(
        context,
        new ConfigError(`App "${path}[${index}].id" "${item.id}" is used twice.`, {
          configKey: item['~k'] ?? configKey,
        })
      );
    }
    seen.add(item.id);
  });
  return valid;
}

// A page path the shell opens, like "/tasks/42": absolute, with no origin.
function checkOptionalPath({ value, path, configKey, context }) {
  if (!checkOptionalString({ value, path, configKey, context })) {
    return false;
  }
  if (type.isString(value) && !value.startsWith('/')) {
    collectExceptions(
      context,
      new ConfigError(`App "${path}" should be a page path starting with "/".`, {
        received: value,
        configKey,
      })
    );
    return false;
  }
  return true;
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
