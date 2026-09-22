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

function SetLocalStorage({ globals, params }) {
  const { window } = globals;
  if (!type.isObject(params)) {
    throw new Error(
      `SetLocalStorage params should be an object. Received ${JSON.stringify(params)}.`
    );
  }
  const { key, value } = params;
  if (!type.isString(key) || key === '') {
    throw new Error(
      `SetLocalStorage key should be a non-empty string. Received ${JSON.stringify(key)}.`
    );
  }
  if (type.isUndefined(value)) {
    throw new Error(`SetLocalStorage value is required. Received undefined for key "${key}".`);
  }
  window.localStorage.setItem(key, serializer.serializeToString(value));
}

export default SetLocalStorage;
