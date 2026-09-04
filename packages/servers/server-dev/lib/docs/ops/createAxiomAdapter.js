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

import renderApl from './renderApl.js';

// Axiom's legacy result envelope: filter queries come back as `matches`
// (one row per event, the event body under `data`), aggregations as
// `buckets.totals` (one entry per group, the metric values keyed by the
// summarize alias under `aggregations`).
function toRows(body) {
  return (body.matches ?? []).map((match) => ({ ...match.data, _time: match._time }));
}

function toGroups(body) {
  return (body.buckets?.totals ?? []).map((total) => {
    const group = { ...total.group };
    (total.aggregations ?? []).forEach((aggregation) => {
      group[aggregation.op] = aggregation.value;
    });
    return group;
  });
}

function createAxiomAdapter({ url, token, dataset, fetchImpl = fetch }) {
  async function run(apl) {
    const response = await fetchImpl(`${url.replace(/\/$/, '')}/v1/datasets/_apl?format=legacy`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ apl }),
    });
    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`Ops sink query failed with ${response.status}: ${detail}`);
    }
    const body = await response.json();
    if (!type.isObject(body)) {
      throw new Error(`Ops sink returned ${JSON.stringify(body)} instead of a result object.`);
    }
    return body;
  }

  return {
    name: 'axiom',
    async query({ where, since, until, limit, order }) {
      return toRows(await run(renderApl({ dataset, where, since, until, limit, order })));
    },
    async aggregate({ where, since, until, limit, group_by: groupBy, metrics }) {
      return toGroups(
        await run(renderApl({ dataset, where, since, until, limit, groupBy, metrics }))
      );
    },
  };
}

export default createAxiomAdapter;
