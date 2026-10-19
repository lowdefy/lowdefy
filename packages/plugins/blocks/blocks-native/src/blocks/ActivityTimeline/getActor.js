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

/**
 * Who did something, as a line names them: `by.name`, else the member with `by.id`, else
 * "Someone". `agent` marks work an agent did, which reads "via agent".
 *
 * @param {Object} params
 * @param {{ id?: string, name?: string, agent?: boolean, picture?: string }} [params.by]
 * @param {Array<{ value: string, label: string, picture?: string }>} [params.members]
 * @returns {{ kind: 'actor', id: string|null, name: string, agent: boolean, picture: string|null }}
 */
function getActor({ by, members }) {
  const who = type.isObject(by) ? by : {};
  const member = type.isNone(who.id)
    ? undefined
    : (members ?? []).find((candidate) => candidate.value === who.id);
  let name = 'Someone';
  if (type.isString(who.name) && who.name !== '') {
    name = who.name;
  } else if (type.isString(member?.label)) {
    name = member.label;
  }
  return {
    kind: 'actor',
    id: who.id ?? null,
    name,
    agent: who.agent === true,
    picture: who.picture ?? member?.picture ?? null,
  };
}

export default getActor;
