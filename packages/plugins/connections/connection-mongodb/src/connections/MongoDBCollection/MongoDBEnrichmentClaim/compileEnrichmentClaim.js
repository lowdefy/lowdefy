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

import buildProjection from '../enrichment/buildProjection.js';
import enrichPath from '../enrichment/enrichPath.js';
import getEnrichmentFilter from '../enrichment/getEnrichmentFilter.js';
import getSourcePaths from '../enrichment/getSourcePaths.js';
import getTargetColumns from '../enrichment/getTargetColumns.js';
import parseColumnDefs from '../enrichment/parseColumnDefs.js';
import parseEnrichmentFields from '../enrichment/parseEnrichmentFields.js';
import parseLimit from '../enrichment/parseLimit.js';
import parseRowKeySettings from '../enrichment/parseRowKeySettings.js';
import resolveInputSources from '../enrichment/resolveInputSources.js';

const requestType = 'MongoDBEnrichmentClaim';

function getCellPaths(columnKey) {
  return {
    attempts: enrichPath({ columnKey, property: 'attempts' }),
    claimToken: enrichPath({ columnKey, property: 'claimToken' }),
    queuedAt: enrichPath({ columnKey, property: 'queuedAt' }),
    runId: enrichPath({ columnKey, property: 'runId' }),
    status: enrichPath({ columnKey, property: 'status' }),
  };
}

// What a claim reads and writes, validated before anything runs: the columns it may claim
// (narrowed by `columns` and `providers`), the paths their inputs read, and its limits.
function compileEnrichmentClaim({ properties, tenantScoped }) {
  const { rowKeyField } = parseRowKeySettings({ properties, requestType });
  const limit = parseLimit({
    value: properties.limit,
    name: 'limit',
    defaultValue: 20,
    min: 1,
    max: 200,
    requestType,
  });
  const leaseMs = parseLimit({
    value: properties.leaseMs,
    name: 'leaseMs',
    defaultValue: 120000,
    min: 1000,
    max: 3600000,
    requestType,
  });
  const maxAttempts = parseLimit({
    value: properties.maxAttempts,
    name: 'maxAttempts',
    defaultValue: 3,
    min: 1,
    max: 100,
    requestType,
  });
  const fieldsByKey = parseEnrichmentFields({ fields: properties.fields, requestType });
  const columnDefsByKey = parseColumnDefs({ columnDefs: properties.columnDefs, requestType });
  const columns = getTargetColumns({
    columns: properties.columns,
    columnDefsByKey,
    providers: properties.providers,
    required: false,
    requestType,
  });
  const filter = getEnrichmentFilter({ filter: properties.filter, tenantScoped, requestType });
  const fieldPaths = [...fieldsByKey.values()].map((field) => field.path);
  const targets = columns.map((columnDef) => {
    const sources = resolveInputSources({
      columnDef,
      columnDefsByKey,
      fieldsByKey,
      requestType,
    });
    const paths = getCellPaths(columnDef.key);
    return {
      columnKey: columnDef.key,
      kind: columnDef.kind,
      title: columnDef.title,
      provider: columnDef.provider,
      prompt: columnDef.prompt,
      output: columnDef.output,
      sources,
      paths,
      projection: buildProjection([
        '_id',
        rowKeyField,
        ...fieldPaths,
        ...getSourcePaths(sources),
        ...Object.values(paths),
      ]),
    };
  });
  return { fieldsByKey, filter, leaseMs, limit, maxAttempts, rowKeyField, targets };
}

export default compileEnrichmentClaim;
