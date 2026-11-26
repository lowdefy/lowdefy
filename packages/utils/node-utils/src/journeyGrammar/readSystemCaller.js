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

const SYSTEM = 'system';

// The system caller a call step's `as` names, or null when it names a person. `as: system` runs
// the endpoint as a cron or detached run does, bound to no organization; `as: { system: {
// organization, caller? } }` runs it as a CallApi with that "organization" and "caller" binds it:
// the tenant wall filters and stamps with the organization, and `_user` is the stand-in caller
// { id, name, organization_id, system: true }, or null with no caller. An inline user object never
// holds "system" (the server refuses an injected caller carrying it), so an object holding it is
// always this form. Returns { organization, caller }, each null when not named. The shape is
// checked by validateJourneySteps.
function readSystemCaller(as) {
  if (as === SYSTEM) {
    return { organization: null, caller: null };
  }
  if (!type.isObject(as) || !Object.hasOwn(as, SYSTEM)) {
    return null;
  }
  return {
    organization: as.system?.organization ?? null,
    caller: as.system?.caller ?? null,
  };
}

export default readSystemCaller;
