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

import { ConfigError, LowdefyInternalError } from '@lowdefy/errors';
import { getFromObject } from '@lowdefy/operators';
import { type } from '@lowdefy/helpers';

// Reads the resolved pinned organization ({ id, slug, name }) the engine
// retained from the startup ensure-by-slug. Evaluated at request time like
// _secret / _payload - the org id is minted at creation and known only after
// startup, so no build-time operator or config var can carry it.
function _organization({ location, organization, params }) {
  if (type.isNone(organization)) {
    throw new ConfigError(
      '_organization requires auth organizations to be configured - no organizations state is available.'
    );
  }
  if (organization.policy === 'tenant') {
    throw new ConfigError(
      '_organization cannot resolve under the "tenant" organizations policy - there is no single pinned organization. Pass an explicit organization id instead.'
    );
  }
  if (type.isNone(organization.pinned)) {
    throw new LowdefyInternalError(
      'The pinned organization has not been resolved - the startup ensure has not completed or failed.'
    );
  }
  return getFromObject({
    location,
    object: organization.pinned,
    operator: '_organization',
    params,
  });
}

_organization.dynamic = true;

export default _organization;
