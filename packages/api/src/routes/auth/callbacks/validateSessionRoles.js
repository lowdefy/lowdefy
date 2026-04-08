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

import { ConfigError } from '@lowdefy/errors';
import { type } from '@lowdefy/helpers';

function validateSessionRoles({ session }) {
  const roles = session?.user?.roles;
  if (type.isNone(roles)) return;
  if (!Array.isArray(roles)) {
    throw new ConfigError(
      'session.user.roles must be an array of strings. Check auth.userFields configuration and custom session callback plugins.',
      { received: roles }
    );
  }
  for (const role of roles) {
    if (!type.isString(role)) {
      throw new ConfigError(
        'session.user.roles must be an array of strings. Check auth.userFields configuration and custom session callback plugins.',
        { received: roles }
      );
    }
  }
}

export default validateSessionRoles;
