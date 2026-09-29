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

import { ConfigError } from '@lowdefy/errors';
import { type } from '@lowdefy/helpers';

import compileAggregates from './compileAggregates.js';
import compileCondition from './compileCondition.js';
import compileGroupPathMatch from './compileGroupPathMatch.js';
import compileProjection from './compileProjection.js';
import compileSearch from './compileSearch.js';
import compileSort from './compileSort.js';
import getCollectionWriteStage from '../tenant/getCollectionWriteStage.js';
import normalizeFields from './normalizeFields.js';
import validateGroupPath from './validateGroupPath.js';
import validateRows from './validateRows.js';
import validateView from './validateView.js';

const DEFAULT_MAX_ROWS = 1000;
// A table fetch runs on every scroll and filter change, so one that MongoDB can not answer
// quickly is stopped rather than left running.
const DEFAULT_MAX_TIME_MS = 10000;

function pageStages({ startRow, endRow }) {
  const stages = [];
  if (startRow > 0) {
    stages.push({ $skip: startRow });
  }
  // $limit must be positive; a zero-row request (total only) matches nothing instead.
  if (endRow > startRow) {
    stages.push({ $limit: endRow - startRow });
  } else {
    stages.push({ $match: { $expr: false } });
  }
  return stages;
}

function compileGroupsFacet({ view, groupPath, fieldsByKey, rows, aggregates }) {
  const groupField = fieldsByKey.get(view.group[groupPath.length].key);
  const groupSort = view.sort.find((item) => item.key === groupField.key);
  const groupId = `$${groupField.path}`;
  return {
    groups: [
      { $group: { _id: groupId, count: { $sum: 1 }, ...aggregates.accumulators } },
      ...aggregates.stages,
      { $sort: { _id: groupSort?.desc ? -1 : 1 } },
      ...pageStages(rows),
    ],
    total: [{ $group: { _id: groupId } }, { $count: 'count' }],
  };
}

// Compiles the validated request to one aggregation:
//   base pipeline (the app's scoping, always first, so the view can only narrow it)
//   → $match filter → $match search → $match groupPath
//   → $facet { rows (projected to the fields) | groups, total, aggregates? }
function compileTableQuery({ properties, now }) {
  const { fields, view, startRow, endRow, groupPath, maxRows, user } = properties;
  const pipeline = properties.pipeline ?? [];
  pipeline.forEach((stage) => {
    const writeStage = getCollectionWriteStage({ stage });
    if (writeStage !== null) {
      throw new ConfigError(`MongoDBTableQuery pipeline can not contain a "${writeStage}" stage.`);
    }
  });
  const fieldsByKey = normalizeFields({ fields });
  const parsedView = validateView({ view, fieldsByKey, user });
  const rows = validateRows({ startRow, endRow, maxRows: maxRows ?? DEFAULT_MAX_ROWS });
  const parsedGroupPath = validateGroupPath({ groupPath, group: parsedView.group });

  const matches = [
    type.isNone(parsedView.filter)
      ? null
      : compileCondition({ condition: parsedView.filter, fieldsByKey, now }),
    compileSearch({ search: parsedView.search, fieldsByKey }),
    compileGroupPathMatch({ groupPath: parsedGroupPath, group: parsedView.group, fieldsByKey }),
  ].filter((match) => match !== null);

  const groupAggregates = compileAggregates({
    aggregates: parsedView.aggregates,
    fieldsByKey,
    distinct: 'set',
  });
  const aggregates = compileAggregates({
    aggregates: parsedView.aggregates,
    fieldsByKey,
    distinct: 'branch',
  });
  const projection =
    properties.project === false
      ? []
      : [compileProjection({ fieldsByKey, returnFields: properties.returnFields })];
  const grouped = parsedGroupPath.length < parsedView.group.length;
  const facet = grouped
    ? compileGroupsFacet({
        view: parsedView,
        groupPath: parsedGroupPath,
        fieldsByKey,
        rows,
        aggregates: groupAggregates,
      })
    : {
        rows: [
          { $sort: compileSort({ sort: parsedView.sort, fieldsByKey }) },
          ...pageStages(rows),
          ...projection,
        ],
        total: [{ $count: 'count' }],
      };
  if (aggregates.specs.length > 0) {
    facet.aggregates = [
      { $group: { _id: null, ...aggregates.accumulators } },
      ...aggregates.stages,
    ];
    Object.assign(facet, aggregates.distinctBranches);
  }

  return {
    grouped,
    options: { maxTimeMS: DEFAULT_MAX_TIME_MS, ...(properties.options ?? {}) },
    pipeline: [...pipeline, ...matches.map((match) => ({ $match: match })), { $facet: facet }],
    specs: aggregates.specs,
  };
}

export default compileTableQuery;
