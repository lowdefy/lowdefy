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

function checkList({ list, name, id, itemKey }) {
  if (type.isUndefined(list)) return [];
  if (
    !type.isArray(list) ||
    !list.every((item) => type.isObject(item) && type.isString(item[itemKey]))
  ) {
    throw new Error(
      `Table provider "${id}" "${name}" must be a list of objects with a "${itemKey}" string. Received ${JSON.stringify(
        list
      )}.`
    );
  }
  return list;
}

// The enrichment provider catalogue (`providers`, design E3): `[{ id, title, description, icon,
// inputs: [{ key, title, type, required }], outputs: [{ path, title, type }], cost }]`. Each maps
// to the app's `enrich_<id>` endpoint on the server, so a column can only call what the app
// exposes. Returns the providers with defaults, validated, in order.
function normalizeProviders(providers) {
  if (type.isNone(providers)) return [];
  if (!type.isArray(providers)) {
    throw new Error(`Table "providers" must be a list. Received ${JSON.stringify(providers)}.`);
  }
  const seen = new Set();
  return providers.map((provider) => {
    if (!type.isObject(provider) || !type.isString(provider.id) || provider.id === '') {
      throw new Error(
        `Table provider requires an "id" string. Received ${JSON.stringify(provider)}.`
      );
    }
    if (seen.has(provider.id)) {
      throw new Error(`Duplicate Table provider id "${provider.id}".`);
    }
    seen.add(provider.id);
    return {
      id: provider.id,
      title: type.isString(provider.title) ? provider.title : provider.id,
      description: type.isString(provider.description) ? provider.description : null,
      icon: provider.icon ?? null,
      cost: type.isNumber(provider.cost) ? provider.cost : null,
      inputs: checkList({ list: provider.inputs, name: 'inputs', id: provider.id, itemKey: 'key' }),
      outputs: checkList({
        list: provider.outputs,
        name: 'outputs',
        id: provider.id,
        itemKey: 'path',
      }),
    };
  });
}

export default normalizeProviders;
