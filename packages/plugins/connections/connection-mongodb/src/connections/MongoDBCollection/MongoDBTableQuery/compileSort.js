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

// _id breaks ties so rows keep one order across block requests; without it, rows with
// equal sort values can repeat or go missing between pages.
function compileSort({ sort, fieldsByKey }) {
  const spec = {};
  sort.forEach(({ key, desc }) => {
    const { path } = fieldsByKey.get(key);
    if (spec[path] === undefined) {
      spec[path] = desc ? -1 : 1;
    }
  });
  if (spec._id === undefined) {
    spec._id = 1;
  }
  return spec;
}

export default compileSort;
