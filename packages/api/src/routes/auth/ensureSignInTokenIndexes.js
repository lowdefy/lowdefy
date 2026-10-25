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

// The unique index on the sign-in token hash, created at server start. The
// exchange looks a token up by its hash, so the lookup is correct without the
// index and only slower; a failure is logged and nothing waits on it. The caller
// fires this without awaiting it, so everything that can reject - the auth
// context included - sits inside the try.
async function ensureSignInTokenIndexes({ auth, logger }) {
  try {
    const { adapter } = await auth.$context;
    const ensureUniqueIndexes = adapter.options?.ensureUniqueIndexes;
    if (!type.isFunction(ensureUniqueIndexes)) {
      logger.warn(
        `Auth database adapter "${adapter.id}" can not create indexes. Create a unique index on the sign-in token hash, or each sign-in token exchange scans the token collection.`
      );
      return;
    }
    await ensureUniqueIndexes({ indexes: [{ model: 'signInToken', fields: ['hash'] }] });
  } catch (error) {
    logger.error(
      { err: error },
      `Could not create the unique index on the sign-in token hash: ${error.message} Sign-in tokens still work, but each exchange scans the token collection.`
    );
  }
}

export default ensureSignInTokenIndexes;
