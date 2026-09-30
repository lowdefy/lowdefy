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

import getChangeLogOrganization from '../MongoDBTableChanges/getChangeLogOrganization.js';

// The organization an unscoped (tenant: none) run on a change-logged tenant connection logs
// under: the one its base filter pins, as for MongoDBTableChanges. Checked before anything is
// written, so a run that could not be logged writes nothing.
function getEnrichmentLogOrganization({ filter, logCollection, operations, tenantGuard }) {
  if (!tenantGuard?.stampChangeLog || !logCollection) return null;
  return getChangeLogOrganization({ filter, operations, field: tenantGuard.field });
}

export default getEnrichmentLogOrganization;
