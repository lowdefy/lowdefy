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

// The pinned organization row is keyed by an id that is not its slug. A
// configuration fault of that database, not a transient one: it will never fix
// itself, and only an operator re-keying the rows can clear it. It needs a
// class of its own because resolvePinnedOrganization swallows ensure failures
// to keep a briefly unreachable database from logging the whole deployment out
// - it can only rethrow this one if it can tell it apart.
class OrganizationKeyError extends ConfigError {
  constructor(message, options) {
    super(message, options);
    this.name = 'OrganizationKeyError';
  }
}

export default OrganizationKeyError;
