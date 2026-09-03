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

// The subtrees of a request's properties in which the runtime refuses an
// authored tenant field, and nothing else. The wall scans exactly these:
// filters and queries (applyTenantToFilter), written documents
// (stampTenantOnDoc), updates including the pipeline form (applyTenantToUpdate),
// the same three inside every bulk operation (applyTenantToBulkOperations) and
// $match stages at any depth of an aggregation pipeline
// (injectTenantIntoPipeline).
//
// Reading the tenant field is always allowed, so a projection, a sort, an index
// hint, a $group _id or any other option is NOT a position: scanning all of
// `properties` would fail the build on `options: { projection: { organization_id: 0 } }`,
// which the runtime happily runs.
const SCANNED_PROPERTIES = ['filter', 'query', 'doc', 'docs', 'update', 'replacement'];
const SCANNED_OPERATION_KEYS = ['document', 'filter', 'replacement', 'update'];

function collectMatchStages(pipeline, positions) {
  if (!type.isArray(pipeline)) return;
  pipeline.forEach((stage) => {
    if (!type.isObject(stage)) return;
    if (!type.isUndefined(stage.$match)) {
      positions.push(stage.$match);
    }
    if (type.isObject(stage.$lookup)) {
      collectMatchStages(stage.$lookup.pipeline, positions);
    }
    if (type.isObject(stage.$unionWith)) {
      collectMatchStages(stage.$unionWith.pipeline, positions);
    }
    if (type.isObject(stage.$facet)) {
      Object.values(stage.$facet).forEach((branch) => collectMatchStages(branch, positions));
    }
  });
}

function collectBulkOperations(operations, positions) {
  if (!type.isArray(operations)) return;
  operations.forEach((operation) => {
    if (!type.isObject(operation)) return;
    Object.values(operation).forEach((body) => {
      if (!type.isObject(body)) return;
      SCANNED_OPERATION_KEYS.forEach((key) => {
        if (!type.isUndefined(body[key])) positions.push(body[key]);
      });
    });
  });
}

function collectAuthoredPositions({ properties }) {
  const positions = [];
  if (!type.isObject(properties)) return positions;
  SCANNED_PROPERTIES.forEach((key) => {
    if (!type.isUndefined(properties[key])) positions.push(properties[key]);
  });
  collectMatchStages(properties.pipeline, positions);
  collectBulkOperations(properties.operations, positions);
  return positions;
}

export default collectAuthoredPositions;
