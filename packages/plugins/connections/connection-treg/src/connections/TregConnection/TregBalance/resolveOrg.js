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
import tregFetch from '../tregFetch.js';

// The numeric id of the team the token acts for, which /orgs/<id>/balance needs. A per-team
// token names its team in /auth/me. An identity token belongs to a person who may be in
// several teams, so its team is the one the connection names in "org", else the active or
// only one.
async function resolveOrg({ connection, signal }) {
  const me = await tregFetch({ connection, path: '/auth/me', signal });
  if (me.status !== 200) {
    throw mapTregError({ response: me, target: 'the balance', connection });
  }
  if (type.isObject(me.body) && type.isInt(me.body.org_id)) {
    return { id: me.body.org_id, slug: me.body.org ?? null };
  }

  const orgs = await tregFetch({ connection, path: '/orgs', signal });
  if (orgs.status !== 200) {
    throw mapTregError({ response: orgs, target: 'the balance', connection });
  }
  const teams = type.isArray(orgs.body) ? orgs.body : [];
  const team = type.isString(connection.org)
    ? teams.find((item) => item.slug === connection.org)
    : teams.find((item) => item.active === true) ?? (teams.length === 1 ? teams[0] : undefined);
  if (type.isUndefined(team)) {
    throw new Error(
      type.isString(connection.org)
        ? `The treg token is not a member of the team "${connection.org}".`
        : 'The treg token belongs to several teams. Set the TregConnection "org" to the team slug.'
    );
  }
  return { id: Number(team.org_id), slug: team.slug ?? null };
}

export default resolveOrg;
