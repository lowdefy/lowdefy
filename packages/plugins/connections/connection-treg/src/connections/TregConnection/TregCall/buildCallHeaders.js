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

import formatMeta from '../formatMeta.js';

// The per-call headers treg reads on /call/. The token and team are added by tregFetch.
function buildCallHeaders({ request, connection }) {
  const headers = {};
  if (type.isString(request.idempotencyKey)) {
    headers['idempotency-key'] = request.idempotencyKey;
  }
  const maxCost = request.maxCost ?? connection.maxCost;
  if (type.isNumber(maxCost)) {
    headers['x-treg-route-max-cost'] = String(maxCost);
  }
  const meta = formatMeta({ ...connection.meta, ...request.meta });
  if (!type.isNone(meta)) {
    headers['x-treg-meta'] = meta;
  }
  if (type.isInt(request.maxAge)) {
    headers['x-treg-max-age'] = String(request.maxAge);
  }
  if (request.noCache === true) {
    headers['cache-control'] = 'no-cache';
  }
  if (type.isBoolean(request.waterfall)) {
    headers['x-treg-route-waterfall'] = request.waterfall ? '1' : '0';
  }
  if (type.isBoolean(request.strictFilters)) {
    headers['x-treg-route-strict-filters'] = request.strictFilters ? '1' : '0';
  }
  return headers;
}

export default buildCallHeaders;
