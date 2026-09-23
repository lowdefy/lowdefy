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

import parseStoredValue from '../../localStorage/parseStoredValue.js';
import validateStorageKey from '../../localStorage/validateStorageKey.js';

function GetLocalStorage({ globals, params }) {
  if (!type.isObject(params)) {
    throw new Error('GetLocalStorage params should be an object.');
  }
  const { key } = params;
  validateStorageKey({ actionType: 'GetLocalStorage', key });
  let item;
  try {
    item = globals.window.localStorage.getItem(key);
  } catch {
    // The browser blocks storage access (e.g. Safari with site data disabled), so read it as
    // not set - the user's browser settings are not an app config error.
    return params.default;
  }
  if (type.isNone(item)) {
    return params.default;
  }
  return parseStoredValue(item);
}

export default GetLocalStorage;
