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

import { get, type } from '@lowdefy/helpers';
import { nunjucksFunction } from '@lowdefy/nunjucks';

import serializeSelectorValue from './serializeSelectorValue.js';

// Selectors can be driven two ways:
//  - `options`: an array of primitives or { label, value } pairs (the original model).
//  - `data` + `html`: raw rows rendered through a Nunjucks template, where `valueKey` names the
//    field stored as the value (omitted -> the whole row).
// Both are normalised here into the option shape the selectors already render: an array of
// primitives or objects carrying `label` (an html string) and `value`, plus any per-option extras
// (color, disabled, style, filterString, icon, tag) the blocks read.

// The identity used to de-duplicate options, kept symmetric with getSelectedIndex: project
// `primaryKey` from each entry's value, or compare the whole value when no `primaryKey` is set.
// `valueKey` has already been applied to produce `entry.value`, so it must not drive identity
// (projecting it off the wrapper entry yielded `undefined` for every option and collapsed them).
function identityOf(entry, primaryKey) {
  const value = type.isPrimitive(entry) ? entry : entry.value;
  return type.isString(primaryKey) && type.isObject(value) ? get(value, primaryKey) : value;
}

function dedupe(entries, primaryKey) {
  const seen = new Set();
  return entries.filter((entry) => {
    const id = serializeSelectorValue(identityOf(entry, primaryKey));
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

const getSelectorOptions = ({ properties }) => {
  const { data, options, valueKey, primaryKey, html } = properties;

  if (type.isArray(data)) {
    const template = type.isString(html) ? nunjucksFunction(html) : null;
    const entries = data.map((item, index) => {
      const value = type.isString(valueKey) && type.isObject(item) ? get(item, valueKey) : item;
      const label = template ? template({ item, index }) : `${value}`;
      return { ...(type.isObject(item) ? item : {}), label, value };
    });
    return dedupe(entries, primaryKey);
  }

  const vk = type.isString(valueKey) ? valueKey : 'value';
  const entries = (options ?? []).map((opt) =>
    type.isPrimitive(opt) ? opt : { ...opt, value: get(opt, vk) }
  );
  return dedupe(entries, primaryKey);
};

export default getSelectorOptions;
