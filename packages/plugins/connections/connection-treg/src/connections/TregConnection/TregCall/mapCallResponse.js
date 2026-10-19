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
import omitTreg from './omitTreg.js';

// The TregCall result for a 2xx answer.
//
// A routed endpoint (treg.<capability>) answers { output, raw, _treg }: output is the
// capability's normalised answer and raw the serving provider's body. Any other endpoint's
// body is the provider's own, relayed verbatim, so it is both output and raw (output
// without any _treg treg added). The cost is what treg charged, X-Treg-Cost-Micro, never
// a catalogue estimate.
function mapCallResponse({ response, routed }) {
  const { status, headers, body } = response;
  const treg = type.isObject(body) && type.isObject(body._treg) ? body._treg : {};
  const routedBody = routed && type.isObject(body);
  return {
    output: routedBody ? body.output ?? null : omitTreg(body),
    raw: routedBody ? body.raw ?? null : body,
    cost: parseCost(headers.get('x-treg-cost-micro')),
    callId: headers.get('x-treg-call-id') ?? null,
    servedBy: headers.get('x-treg-served-by') ?? treg.served_by ?? null,
    tried: type.isArray(treg.tried) ? treg.tried : [],
    outcome: headers.get('x-treg-route-outcome') ?? treg.outcome ?? null,
    cached: headers.get('x-treg-cache') === 'hit',
    replayed: headers.get('x-treg-idempotent-replay') === 'true',
    pending: false,
    task: null,
    httpStatus: status,
  };
}

export default mapCallResponse;
