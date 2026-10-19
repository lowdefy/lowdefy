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

// describeElement's result without what a record keeps elsewhere: the page
// sits on the record and the enclosing block ids feed pairing only.
function recordTarget(target) {
  if (type.isNone(target)) return null;
  const { page_id: _pageId, block_ids: _blockIds, ...rest } = target;
  return rest;
}

// A DOM interaction as a v1 trace record. `paired` are the trace events the
// pairing rule gave it, innermost first: the first is `event`, the rest go to
// `also`. `build` is the build of the page config the interaction happened
// on; `source` and `run` are stamped by the dev server, never the page.
function buildInteractionRecord({ interaction, paired = [], session, roles }) {
  const record = {
    v: 1,
    session,
    t: new Date(interaction.t).toISOString(),
    kind: interaction.kind,
    scope: 'page',
    page_id: interaction.target?.page_id ?? interaction.pageId,
    roles: roles ?? [],
    person: null,
    org: null,
    target: recordTarget(interaction.target),
    event: paired[0] ?? null,
    build: interaction.build ?? null,
  };
  if (paired.length > 1) {
    record.also = paired.slice(1);
  }
  if (interaction.kind === 'pageview') {
    record.url = interaction.url;
    if (!type.isNone(interaction.pathParams)) {
      record.path_params = interaction.pathParams;
    }
  }
  if (interaction.kind === 'change') {
    record.value = interaction.value ?? null;
  }
  if (interaction.kind === 'key') {
    record.key = interaction.key;
  }
  return record;
}

export default buildInteractionRecord;
