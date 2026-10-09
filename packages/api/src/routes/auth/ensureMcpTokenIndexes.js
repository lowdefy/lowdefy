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

// The unique index on the member token hash, created at server start. It is
// kept out of ensureAuthIndexes on purpose: that list guards the organization
// mint, which refuses to run while it fails, and a token index problem must
// never block sign-ups. The MCP route's lookup by hash is correct without the
// index, only slower, so a failure is logged and nothing waits on it.
//
// The caller fires this without awaiting it, so everything that can reject -
// the auth context included - sits inside the try.
async function ensureMcpTokenIndexes({ auth, logger }) {
  try {
    const { adapter } = await auth.$context;
    const ensureUniqueIndexes = adapter.options?.ensureUniqueIndexes;
    if (!type.isFunction(ensureUniqueIndexes)) {
      logger.warn(
        `Auth database adapter "${adapter.id}" can not create indexes. Create a unique index on the member token hash, or each MCP call with a member token scans the token collection.`
      );
      return;
    }
    await ensureUniqueIndexes({ indexes: [{ model: 'mcpToken', fields: ['hash'] }] });
  } catch (error) {
    logger.error(
      { err: error },
      `Could not create the unique index on the member token hash: ${error.message} Member tokens still work, but each MCP call with one scans the token collection.`
    );
  }
}

export default ensureMcpTokenIndexes;
