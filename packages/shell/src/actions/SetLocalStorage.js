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

import { serializer, type } from '@lowdefy/helpers';
import validateStorageKey from '@lowdefy/actions-core/localStorage/validateStorageKey.js';

// The native body of actions-core's SetLocalStorage: writes the app's key to the device store
// (expo-sqlite's key-value store), where the web writes localStorage.
function SetLocalStorage({ globals, methods, params }) {
  if (!type.isObject(params)) {
    throw new Error('SetLocalStorage params should be an object.');
  }
  const { key, value } = params;
  validateStorageKey({ actionType: 'SetLocalStorage', key });
  if (type.isUndefined(value)) {
    throw new Error('SetLocalStorage "value" is required.');
  }
  globals.storage.set(methods.getAppStorageKey(key), serializer.serializeToString(value));
}

export default SetLocalStorage;
