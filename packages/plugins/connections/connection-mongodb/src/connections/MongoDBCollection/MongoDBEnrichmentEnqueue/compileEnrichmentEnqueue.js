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

import { ObjectId } from 'mongodb';
import { type } from '@lowdefy/helpers';

import compileSelectionMatches from '../MongoDBTableChanges/compileSelectionMatches.js';
import parseSelection from '../MongoDBTableChanges/parseSelection.js';
import andConditions from '../enrichment/andConditions.js';
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
import getModeCondition from './getModeCondition.js';

const requestType = 'MongoDBEnrichmentEnqueue';
const modes = ['all', 'empty', 'errors', 'stale'];
const RUN_ID = /^[A-Za-z0-9_-]{1,64}$/;

function generateRunId() {
  return new ObjectId().toHexString();
}

function getRunId({ runId, generate }) {
  if (type.isNone(runId)) return generate();
  if (!type.isString(runId) || !RUN_ID.test(runId)) {
    throw new Error(
      `${requestType} "runId" should be 1 to 64 letters, digits, "_" or "-". Received ${JSON.stringify(
        runId
      )}.`
    );
  }
  return runId;
}

function getMode(mode) {
  if (type.isNone(mode)) return 'all';
  if (!modes.includes(mode)) {
    throw new Error(
      `${requestType} "mode" should be one of ${JSON.stringify(modes)}. Received ${JSON.stringify(
        mode
      )}.`
    );
  }
  return mode;
}

function getSelectionMatches({ properties, maxCells, now, rowKeyField, rowKeyType }) {
  if (type.isNone(properties.selection)) return [];
  const selection = parseSelection({
    selection: properties.selection,
    rowKeyType,
    maxKeys: maxCells,
    maxKeysName: 'maxCells',
    requestType,
  });
  return compileSelectionMatches({
    selection,
    queryFields: properties.fields,
    queryFieldsName: 'fields',
    user: properties.user,
    timezone: properties.timezone,
    now,
    rowKeyField,
    rowKeyType,
    requestType,
  });
}

// What an enqueue reads and writes, validated before anything runs: the target columns with
// the paths their inputs read, the rows (base filter and selection) and the mode's cells.
// `now` and `generate` are passed in so a compile is deterministic in tests.
function compileEnrichmentEnqueue({ properties, tenantScoped, now, generate = generateRunId }) {
  const { rowKeyField, rowKeyType } = parseRowKeySettings({ properties, requestType });
  const mode = getMode(properties.mode);
  const maxCells = parseLimit({
    value: properties.maxCells,
    name: 'maxCells',
    defaultValue: 10000,
    min: 1,
    max: 1000000,
    requestType,
  });
  const maxTimeMS = parseLimit({
    value: properties.maxTimeMS,
    name: 'maxTimeMS',
    defaultValue: 30000,
    min: 1,
    max: 600000,
    requestType,
  });
  const runId = getRunId({ runId: properties.runId, generate });
  const fieldsByKey = parseEnrichmentFields({ fields: properties.fields, requestType });
  const columnDefsByKey = parseColumnDefs({ columnDefs: properties.columnDefs, requestType });
  const columns = getTargetColumns({
    columns: properties.columns,
    columnDefsByKey,
    required: true,
    requestType,
  });
  const filter = getEnrichmentFilter({ filter: properties.filter, tenantScoped, requestType });
  const scope = andConditions([
    filter,
    ...getSelectionMatches({ properties, maxCells, now, rowKeyField, rowKeyType }),
  ]);
  const targets = columns.map((columnDef) => {
    const sources = resolveInputSources({
      columnDef,
      columnDefsByKey,
      fieldsByKey,
      requestType,
    });
    const inputHashPath = enrichPath({ columnKey: columnDef.key, property: 'inputHash' });
    return {
      columnKey: columnDef.key,
      sources,
      inputHashPath,
      condition: getModeCondition({ mode, columnKey: columnDef.key, now }),
      projection: buildProjection(['_id', inputHashPath, ...getSourcePaths(sources)]),
    };
  });
  return { filter, maxCells, maxTimeMS, mode, now, runId, scope, targets };
}

export default compileEnrichmentEnqueue;
