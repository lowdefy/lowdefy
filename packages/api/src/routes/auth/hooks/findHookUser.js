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

// Fetches the subject user for points whose payload catalog includes a user
// the database hook does not receive directly (session and account writes
// carry only a userId). Reads through BetterAuth's own internal adapter from
// the hook's endpoint context; null when the write runs outside a request
// lifecycle and no context is available.
async function findHookUser({ ctx, userId }) {
  if (type.isNone(userId) || type.isNone(ctx?.context?.internalAdapter?.findUserById)) {
    return null;
  }
  return (await ctx.context.internalAdapter.findUserById(userId)) ?? null;
}

export default findHookUser;
