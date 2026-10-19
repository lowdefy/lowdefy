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

import { readDevInstance } from '@lowdefy/node-utils';

// Checked before getServer and installServer, which rewrite .lowdefy/dev under
// a running server when versions differ - the manager's own check comes too
// late to protect it.
function checkNoRunningInstance({ context }) {
  const holder = readDevInstance({ configDirectory: context.directories.config });
  if (holder === null) {
    return;
  }
  const where = holder.url ? `, ${holder.url}` : '';
  const stopHint =
    holder.owner === 'hub'
      ? `Use it, or stop it with: lowdefy hub stop ${context.directories.config}`
      : 'Use it, or stop it first.';
  throw new Error(
    `A dev server for this app is already running (${holder.owner}${where}, pid ${holder.pid}). ${stopHint}`
  );
}

export default checkNoRunningInstance;
