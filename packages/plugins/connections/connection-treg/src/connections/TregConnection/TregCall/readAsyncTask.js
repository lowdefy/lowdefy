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

import parseCost from '../parseCost.js';
import readJsonPath from './readJsonPath.js';

// The async task a 2xx answer started, or null when the answer is final.
//
// treg describes an async task in X-Treg-Async: where to poll (a catalog endpoint and the
// parameter that takes the task id) and which status values mean done or failed. A routed
// endpoint that is still waiting on its provider answers 202 with the same descriptor in
// _treg.async; that body is also what an idempotent replay returns, without the header, so
// a retry with the same Idempotency-Key finds the task again.
function readAsyncTask({ response, target }) {
  const { headers, body } = response;
  const header = headers.get('x-treg-async');
  const treg = type.isObject(body) && type.isObject(body._treg) ? body._treg : {};
  let descriptor = null;
  if (type.isString(header) && header !== '') {
    try {
      descriptor = JSON.parse(header);
    } catch {
      throw new Error(`treg answered ${target} with an X-Treg-Async header that is not JSON.`);
    }
  } else if (treg.outcome === 'pending' && type.isObject(treg.async)) {
    descriptor = treg.async;
  }
  if (!type.isObject(descriptor)) return null;

  const id = descriptor.task_id ?? treg.async?.task_id ?? readJsonPath(body, descriptor.id_from);
  if (type.isNone(id) || id === '') {
    throw new Error(`treg answered ${target} with an async task but no task id.`);
  }
  return {
    id: String(id),
    descriptor,
    pollEndpoint: descriptor.poll?.endpoint ?? null,
    // Held at submission and charged only when the task succeeds.
    reserved: parseCost(
      headers.get('x-treg-reserved-micro') ??
        (type.isInt(treg.reserved_micro) ? String(treg.reserved_micro) : null) ??
        headers.get('x-treg-cost-micro')
    ),
  };
}

export default readAsyncTask;
