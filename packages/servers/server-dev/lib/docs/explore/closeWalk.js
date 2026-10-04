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

import closeWalkSession from './closeWalkSession.js';
import { getWalk } from './walkSessions.js';

// DELETE /lowdefy-docs/explore/walks/:id: closes an open walk (see
// closeWalkSession). Returns { status, body }: 200 with { closed: true }, or
// 404 for a walk that is not open.
async function closeWalk({ walkId }) {
  const walk = getWalk(walkId);
  if (walk === null) {
    return { status: 404, body: { error: `No open walk "${walkId}".` } };
  }
  await closeWalkSession(walk);
  return { status: 200, body: { closed: true } };
}

export default closeWalk;
