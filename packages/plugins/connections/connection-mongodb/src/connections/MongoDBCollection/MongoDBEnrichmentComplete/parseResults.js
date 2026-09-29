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

import coerceRowKey from '../MongoDBTableChanges/coerceRowKey.js';
import getKeyForms from '../MongoDBTableChanges/getKeyForms.js';
import getKeyId from '../MongoDBTableChanges/getKeyId.js';

const requestType = 'MongoDBEnrichmentComplete';
const resultKeys = [
  'rowKey',
  'columnKey',
  'claimToken',
  'status',
  'value',
  'raw',
  'cost',
  'error',
  'retry',
];
const statuses = ['ok', 'error', 'empty'];
// A claim token is 24 random hex digits, then the hash of the inputs the claim was given.
const CLAIM_TOKEN = /^[0-9a-f]{24}:([0-9a-f]{14})$/;
const maxResults = 1000;
const maxErrorLength = 2000;

function invalid({ index, message, received }) {
  return new Error(
    `${requestType} "results" item ${index} ${message} Received ${JSON.stringify(received)}.`
  );
}

function parseError({ result, index }) {
  if (type.isNone(result.error)) {
    return result.status === 'error' ? 'Enrichment failed.' : null;
  }
  if (!type.isString(result.error)) {
    throw invalid({ index, message: '"error" should be a string.', received: result.error });
  }
  return result.error.slice(0, maxErrorLength);
}

function parseResult({ result, index, columnDefsByKey, rowKeyType }) {
  if (!type.isObject(result)) {
    throw invalid({
      index,
      message: 'should be { rowKey, columnKey, claimToken, status, value?, raw?, error? }.',
      received: result,
    });
  }
  const unknownKey = Object.keys(result).find((key) => !resultKeys.includes(key));
  if (unknownKey !== undefined) {
    throw invalid({
      index,
      message: `has an unknown key: results only have ${resultKeys.join(', ')}.`,
      received: unknownKey,
    });
  }
  if (columnDefsByKey.get(result.columnKey)?.runnable !== true) {
    throw invalid({
      index,
      message: '"columnKey" should be an enrichment or ai column of "columnDefs".',
      received: result.columnKey,
    });
  }
  const tokenMatch = type.isString(result.claimToken) ? CLAIM_TOKEN.exec(result.claimToken) : null;
  if (tokenMatch === null) {
    throw invalid({
      index,
      message: '"claimToken" should be the claimToken MongoDBEnrichmentClaim returned.',
      received: result.claimToken,
    });
  }
  if (!statuses.includes(result.status)) {
    throw invalid({
      index,
      message: `"status" should be one of ${JSON.stringify(statuses)}.`,
      received: result.status,
    });
  }
  if (!type.isNone(result.cost) && !(type.isInt(result.cost) && result.cost >= 0)) {
    throw invalid({
      index,
      message: '"cost" should be a whole number of micro-USD, 0 or more.',
      received: result.cost,
    });
  }
  if (!type.isNone(result.retry) && !type.isBoolean(result.retry)) {
    throw invalid({ index, message: '"retry" should be a boolean.', received: result.retry });
  }
  const rowKey = coerceRowKey({ value: result.rowKey, rowKeyType, part: 'results', requestType });
  return {
    rowKey,
    keyForms: getKeyForms({ key: rowKey, rowKeyType }),
    columnKey: result.columnKey,
    claimToken: result.claimToken,
    inputHash: tokenMatch[1],
    status: result.status,
    value: result.value,
    raw: result.raw,
    cost: type.isNone(result.cost) ? undefined : result.cost,
    error: parseError({ result, index }),
    retry: result.retry !== false,
  };
}

// The worker's results, checked before anything is written: each names a claimed cell (a row
// key, an enrichment column of `columnDefs` and the claim's token) once, with a status.
function parseResults({ results, columnDefsByKey, rowKeyType }) {
  if (!type.isArray(results)) {
    throw new Error(
      `${requestType} "results" should be an array of { rowKey, columnKey, claimToken, status }. Received ${JSON.stringify(
        results
      )}.`
    );
  }
  if (results.length > maxResults) {
    throw new Error(
      `${requestType} "results" has ${results.length} results, more than ${maxResults}. Complete each claim on its own.`
    );
  }
  const seen = new Set();
  return results.map((result, index) => {
    const parsed = parseResult({ result, index, columnDefsByKey, rowKeyType });
    const cellId = `${getKeyId(parsed.rowKey)}|${parsed.columnKey}`;
    if (seen.has(cellId)) {
      throw invalid({
        index,
        message: 'repeats a cell of an earlier result.',
        received: { rowKey: result.rowKey, columnKey: parsed.columnKey },
      });
    }
    seen.add(cellId);
    return parsed;
  });
}

export default parseResults;
