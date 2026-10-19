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

// 'items.0.name' gives 'items.0.name', 'items.0' and 'items'.
function getFieldsAndParents(fields) {
  const result = new Set();
  fields.forEach((field) => {
    result.add(field);
    let end = field.lastIndexOf('.');
    while (end > 0) {
      result.add(field.slice(0, end));
      end = field.lastIndexOf('.', end - 1);
    }
  });
  return result;
}

export default getFieldsAndParents;
