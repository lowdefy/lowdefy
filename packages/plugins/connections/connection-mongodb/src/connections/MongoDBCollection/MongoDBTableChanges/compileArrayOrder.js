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
// A pipeline update that puts the items of an embedded array in the order of `keyForms` (the
// forms each key matches, getKeyForms), on the server and against the array as it is when
// the update runs: items are moved, never rewritten, so a concurrent edit of an item's fields
// is kept. Items the order does not name (added by someone else since the table loaded)
// follow in their current order; keys whose item is gone are skipped. The keys are $literal,
// so a key such as "$items" is a value, not a field path.
function compileArrayOrder({ path, itemKeyField, keyForms }) {
  const items = `$${path}`;
  const itemKey = `$$item.${itemKeyField}`;
  const ordered = {
    $filter: {
      input: {
        $map: {
          input: { $literal: keyForms },
          as: 'forms',
          in: {
            $arrayElemAt: [
              { $filter: { input: items, as: 'item', cond: { $in: [itemKey, '$$forms'] } } },
              0,
            ],
          },
        },
      },
      as: 'found',
      cond: { $ne: ['$$found', null] },
    },
  };
  const rest = {
    $filter: {
      input: items,
      as: 'item',
      cond: { $not: [{ $in: [itemKey, { $literal: keyForms.flat() }] }] },
    },
  };
  return [
    {
      $set: {
        [path]: {
          $cond: {
            if: { $isArray: items },
            then: { $concatArrays: [ordered, rest] },
            else: items,
          },
        },
      },
    },
  ];
}

export default compileArrayOrder;
