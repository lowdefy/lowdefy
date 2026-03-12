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

function extractBlockTypes(metas) {
  const entries = Object.entries(metas);
  const blocks = entries.map(([name]) => name);
  const icons = {};
  const blockMetas = {};
  for (const [name, meta] of entries) {
    icons[name] = meta.icons ?? [];
    const entry = { category: meta.category };
    if (meta.valueType != null) entry.valueType = meta.valueType;
    if (meta.initValue !== undefined) entry.initValue = meta.initValue;
    if (meta.slots !== undefined) entry.slots = meta.slots;
    if (meta.cssKeys) entry.cssKeys = Object.keys(meta.cssKeys);
    blockMetas[name] = entry;
  }
  return { blocks, icons, blockMetas };
}

export default extractBlockTypes;
