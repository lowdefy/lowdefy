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

// Sets the caller the app renders. CallAPI results (lowdefy.apiResponses, read
// by _api) are app-level, so they are kept per organization as page contexts
// are (see the engine's getContext): when the caller's organization changes,
// the results fetched under the previous one are dropped, so none is read
// under another organization. Results fetched with no organization hold no
// organization's data and are kept when the caller gains one. A call still in
// flight writes into the dropped object. Author global state is left alone.
function setLowdefyUser({ lowdefy, user }) {
  const organizationId = user?.organization_id ?? null;
  const resultsOrganizationId = lowdefy._internal.apiResponsesOrganizationId;
  if (!type.isNone(resultsOrganizationId) && resultsOrganizationId !== organizationId) {
    lowdefy.apiResponses = {};
  }
  lowdefy._internal.apiResponsesOrganizationId = organizationId;
  lowdefy.user = user ?? null;
}

export default setLowdefyUser;
