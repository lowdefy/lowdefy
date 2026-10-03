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

const MIN_PERSONS = 5;
const MIN_ORGS = 2;

function textKey({ record }) {
  return JSON.stringify([record.page_id, record.target.block_id ?? null, record.target.text]);
}

function hasText(record) {
  return type.isString(record.target?.text) && record.target.text !== '';
}

// Production `text` is the element's text. On a button it is interface text;
// in a grid cell or a list row it can be a customer's data. Text clicked by at
// least 5 distinct persons is interface text, and, when the window holds 2 or
// more orgs, it must also come from persons in 2 orgs so one customer's own
// records never qualify. A window with no org on any record counts as one org.
// Below the threshold, `text` and `nth` go and the block, row and column stay.
// Dev and explorer records are the developer's own, and are never thresholded.
//
// `records` is the whole window, in any order; the same records come back in
// the same order.
function applyTextThreshold({ records }) {
  const production = records.filter((record) => record.source === 'production');
  const windowOrgs = new Set(production.map((record) => record.org).filter(type.isString));
  const needOrgs = windowOrgs.size >= MIN_ORGS;

  const clickers = new Map();
  production.filter(hasText).forEach((record) => {
    const key = textKey({ record });
    if (!clickers.has(key)) clickers.set(key, { persons: new Set(), orgs: new Set() });
    const entry = clickers.get(key);
    if (type.isString(record.person)) entry.persons.add(record.person);
    if (type.isString(record.org)) entry.orgs.add(record.org);
  });

  function keepsText({ record }) {
    const entry = clickers.get(textKey({ record }));
    if (entry.persons.size < MIN_PERSONS) return false;
    return !needOrgs || entry.orgs.size >= MIN_ORGS;
  }

  return records.map((record) => {
    if (record.source !== 'production' || !hasText(record) || keepsText({ record })) {
      return record;
    }
    return { ...record, target: { ...record.target, text: null, nth: null } };
  });
}

export { MIN_ORGS, MIN_PERSONS };

export default applyTextThreshold;
