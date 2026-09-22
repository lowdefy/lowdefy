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

function RemoveLocalStorage({ globals, params }) {
  const { window } = globals;
  if (!type.isObject(params)) {
    throw new Error(
      `RemoveLocalStorage params should be an object. Received ${JSON.stringify(params)}.`
    );
  }
  const { key } = params;
  if (!type.isString(key) || key === '') {
    throw new Error(
      `RemoveLocalStorage key should be a non-empty string. Received ${JSON.stringify(key)}.`
    );
  }
  window.localStorage.removeItem(key);
}

export default RemoveLocalStorage;
