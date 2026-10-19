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

import mapTregError from '../mapTregError.js';
import microUsd from '../microUsd.js';
import tregFetch from '../tregFetch.js';
import resolveOrg from './resolveOrg.js';
import schema from './schema.js';

// The team's prepaid balance, the spend held by calls in flight, and (for team admins) the
// recent ledger.
async function TregBalance({ request, connection, signal }) {
  const org = await resolveOrg({ connection, signal });
  const response = await tregFetch({
    connection,
    path: `/orgs/${org.id}/balance`,
    query: { limit: request.limit ?? 20 },
    signal,
  });
  if (response.status !== 200) {
    throw mapTregError({ response, target: 'the balance', connection });
  }
  const body = type.isObject(response.body) ? response.body : {};
  const holds = type.isArray(body.holds) ? body.holds : [];
  const heldMicro = holds.reduce(
    (sum, hold) => sum + (type.isInt(hold.amount_micro) ? hold.amount_micro : 0),
    0
  );
  return {
    orgId: org.id,
    org: org.slug,
    balance: microUsd(type.isInt(body.balance_micro) ? body.balance_micro : 0),
    held: microUsd(heldMicro),
    holds,
    entries: type.isArray(body.entries?.items) ? body.entries.items : [],
  };
}

TregBalance.schema = schema;
TregBalance.meta = {
  checkRead: false,
  checkWrite: false,
};

export default TregBalance;
