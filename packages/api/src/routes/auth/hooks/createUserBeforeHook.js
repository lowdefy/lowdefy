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

import { APIError } from 'better-auth/api';
import { type } from '@lowdefy/helpers';
import { ConfigError } from '@lowdefy/errors';

// Translates the routine's terminal control into BetterAuth's before-hook
// contract. The routine `:return`s plain data - the ceremony lives here:
// returned data replaces the record ({ data } wrap), a fall-through leaves
// the record unchanged, and `:reject`/throw aborts the write.
function createUserBeforeHook({ dispatch, hook }) {
  return async function userBeforeHook(data, ctx) {
    const result = await dispatch(data, ctx);
    if (result.status === 'return') {
      if (!type.isObject(result.response)) {
        throw new ConfigError(
          `Auth hook "${hook.id}" at point "${hook.point}" returned a ${type.typeOf(
            result.response
          )}. A before hook ":return" value replaces the record being written, so it should be an object.`,
          { received: result.response }
        );
      }
      return { data: result.response };
    }
    if (result.status === 'reject') {
      throw new APIError('BAD_REQUEST', { message: result.error.message });
    }
    if (result.status === 'error') {
      throw result.error;
    }
    // The routine fell through without a terminal control - record unchanged.
    return undefined;
  };
}

export default createUserBeforeHook;
