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
import { ConfigError } from '@lowdefy/errors';

// Best-effort DX check, NOT the enforcement gate. On a walled connection, a
// pipeline the wall can not scope mechanically - one that begins with a
// first-stage-only stage ($search, $searchMeta, $vectorSearch, $geoNear) or
// contains $graphLookup - must declare `tenant: authored` and author the
// tenant clause itself. The runtime audit in connection-mongodb is the
// contract (request properties are operator-evaluated, so an
// operator-composed pipeline is invisible here and passes silently); this
// check raises the same refusal at build for the common literal case, so
// `lowdefy build` and CI catch it before deploy.
const AUTHORED_ENTRY_STAGES = ['$search', '$searchMeta', '$vectorSearch', '$geoNear'];

function validateTenantPipelineEntry({ config, location, tenantConnectionIds, configKey }) {
  if (config.tenant === 'none' || config.tenant === 'authored') {
    return;
  }
  if (!tenantConnectionIds || !tenantConnectionIds.has(config.connectionId)) {
    return;
  }
  const pipeline = config.properties?.pipeline;
  if (!type.isArray(pipeline)) {
    return;
  }
  const first = pipeline[0];
  const entryStage =
    type.isObject(first) && AUTHORED_ENTRY_STAGES.find((key) => first[key] !== undefined);
  const graphLookup = pipeline.some(
    (stage) => type.isObject(stage) && stage.$graphLookup !== undefined
  );
  if (entryStage || graphLookup) {
    const stageKey = entryStage || '$graphLookup';
    throw new ConfigError(
      `${location} contains "${stageKey}" on tenant connection "${config.connectionId}", which the tenant wall does not scope mechanically. Author the organization clause inside the stage (for $search/$searchMeta: an equals clause on the tenant field in "compound.filter"; for $vectorSearch/$geoNear/$graphLookup: a tenant-field equality in "filter"/"query"/"restrictSearchWithMatch"), then declare tenant: authored on it to confirm it owns its organization scoping. The clause is audited against the caller's organization at runtime.`,
      { configKey }
    );
  }
}

export default validateTenantPipelineEntry;
