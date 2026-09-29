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

import getEnrichmentFilter from '../enrichment/getEnrichmentFilter.js';
import parseColumnDefs from '../enrichment/parseColumnDefs.js';
import parseLimit from '../enrichment/parseLimit.js';
import parseRowKeySettings from '../enrichment/parseRowKeySettings.js';
import parseResults from './parseResults.js';

const requestType = 'MongoDBEnrichmentComplete';

// Enrichment and ai columns with autoRun, by the key of each column they read, so a column
// that completes names the columns that can run next.
function getDownstreamByColumn(columnDefsByKey) {
  const downstream = new Map();
  columnDefsByKey.forEach((columnDef) => {
    if (!columnDef.runnable || !columnDef.autoRun) return;
    columnDef.inputs.forEach((input) => {
      if (input.column === undefined) return;
      const keys = downstream.get(input.column) ?? [];
      if (!keys.includes(columnDef.key)) keys.push(columnDef.key);
      downstream.set(input.column, keys);
    });
  });
  return downstream;
}

// What a complete writes, validated before anything runs: the results, the retry policy and
// the size limit of stored results.
function compileEnrichmentComplete({ properties, tenantScoped }) {
  const { rowKeyField, rowKeyType } = parseRowKeySettings({ properties, requestType });
  const maxAttempts = parseLimit({
    value: properties.maxAttempts,
    name: 'maxAttempts',
    defaultValue: 3,
    min: 1,
    max: 100,
    requestType,
  });
  const backoffMs = parseLimit({
    value: properties.backoffMs,
    name: 'backoffMs',
    defaultValue: 30000,
    min: 0,
    max: 86400000,
    requestType,
  });
  const rawMaxBytes = parseLimit({
    value: properties.rawMaxBytes,
    name: 'rawMaxBytes',
    defaultValue: 65536,
    min: 1024,
    max: 8388608,
    requestType,
  });
  const columnDefsByKey = parseColumnDefs({ columnDefs: properties.columnDefs, requestType });
  const filter = getEnrichmentFilter({ filter: properties.filter, tenantScoped, requestType });
  const results = parseResults({ results: properties.results, columnDefsByKey, rowKeyType });
  return {
    backoffMs,
    downstreamByColumn: getDownstreamByColumn(columnDefsByKey),
    filter,
    maxAttempts,
    rawMaxBytes,
    results,
    rowKeyField,
  };
}

export default compileEnrichmentComplete;
