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

// "Since the deploy" is not a clock time, it is a git_sha: on serverless every
// cold start writes its own process_started line, so the deploy started at the
// FIRST process_started carrying the sha the LATEST one carries.
async function resolveOpsSince({ adapter, since }) {
  if (since !== 'deploy') {
    return { since: since ?? null, git_sha: null };
  }
  const [latest] = await adapter.query({
    where: [['event', 'eq', 'process_started']],
    order: 'desc',
    limit: 1,
  });
  if (type.isNone(latest)) {
    return {
      since: null,
      git_sha: null,
      note: 'No process_started event in the sink, so "deploy" could not be resolved; the whole retention window was searched.',
    };
  }
  const [first] = await adapter.query({
    where: [
      ['event', 'eq', 'process_started'],
      ['git_sha', 'eq', latest.git_sha ?? null],
    ],
    order: 'asc',
    limit: 1,
  });
  return { since: (first ?? latest)._time, git_sha: latest.git_sha ?? null };
}

export default resolveOpsSince;
