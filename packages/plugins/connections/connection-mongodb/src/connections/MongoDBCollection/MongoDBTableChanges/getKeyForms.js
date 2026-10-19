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

// The values a coerced row key matches. With rowKeyType "auto" a numeric key matches its
// number and its string form: the Table sends the key 5 as "5" where it is an object key
// (`updated`, `moved`) and as 5 in `removed` and `order`, and the document may hold either.
// "string" and "number" match exactly the one form they read.
function getKeyForms({ key, rowKeyType }) {
  if (rowKeyType === 'auto' && type.isNumber(key)) return [key, String(key)];
  return [key];
}

export default getKeyForms;
