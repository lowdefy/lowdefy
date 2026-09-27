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

import markDataObject from './markDataObject.js';

// Remembers every object in an operator's result as data returned by it.
function markDataObjects({ literalData, value, operator }) {
  if (type.isArray(value)) {
    value.forEach((item) => markDataObjects({ literalData, value: item, operator }));
    return;
  }
  if (!type.isObject(value)) {
    return;
  }
  markDataObject({ literalData, value, operator });
  Object.keys(value).forEach((key) =>
    markDataObjects({ literalData, value: value[key], operator })
  );
}

export default markDataObjects;
