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

// A copy of a parsed build artifact with every ~k and ~r id replaced by the
// describer's description of it, so the copy names config locations, not ids.
function replaceConfigIds({ value, describer }) {
  if (Array.isArray(value)) {
    return value.map((item) => replaceConfigIds({ value: item, describer }));
  }
  if (value === null || typeof value !== 'object') {
    return value;
  }
  const copy = {};
  for (const [key, child] of Object.entries(value)) {
    if (key === '~k' && typeof child === 'string') {
      copy[key] = describer.describeKey(child);
    } else if (key === '~r' && typeof child === 'string') {
      copy[key] = describer.describeRef(child);
    } else {
      copy[key] = replaceConfigIds({ value: child, describer });
    }
  }
  return copy;
}

export default replaceConfigIds;
