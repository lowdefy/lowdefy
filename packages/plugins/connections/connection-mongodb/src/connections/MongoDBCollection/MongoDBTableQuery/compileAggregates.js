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

function isEmptyExpression({ path }) {
  return { $in: [{ $ifNull: [`$${path}`, null] }, [null, '', []]] };
}

// $min and $max skip null and missing values; for text an empty string would be the minimum,
// so empty values are left out, as the Table's own footers leave them out.
function compileExtremeValue({ field, isEmpty }) {
  if (field.family === 'text') return { $cond: [isEmpty, '$$REMOVE', `$${field.path}`] };
  return `$${field.path}`;
}

// A distinct count of the whole set as its own $facet branch: one $group document per value,
// then a count, where an $addToSet would build every distinct value into one document (16MB).
function compileDistinctBranch({ path }) {
  return [
    { $group: { _id: `$${path}` } },
    { $match: { _id: { $nin: [null, '', []] } } },
    { $count: 'count' },
  ];
}

// Accumulators are named a0, a1, ... because field keys may contain dots, which a $group
// output field can not. `specs` maps the names back to field keys (readAggregates). The
// whole set (`distinct: 'branch'`) counts distinct values in `distinctBranches`, named
// distinct_a0, ...; a group level counts them with a set per group, which the field being
// groupable bounds.
function compileAggregates({ aggregates, fieldsByKey, distinct }) {
  const accumulators = {};
  const addFields = {};
  const distinctBranches = {};
  const specs = [];
  Object.entries(aggregates).forEach(([key, fn], index) => {
    const name = `a${index}`;
    const field = fieldsByKey.get(key);
    const { path } = field;
    const isEmpty = isEmptyExpression({ path });
    specs.push({ key, fn, name });
    switch (fn) {
      case 'count':
        accumulators[name] = { $sum: 1 };
        break;
      case 'sum':
        accumulators[name] = { $sum: `$${path}` };
        break;
      case 'avg':
        accumulators[name] = { $avg: `$${path}` };
        break;
      case 'min':
      case 'earliest':
        accumulators[name] = { $min: compileExtremeValue({ field, isEmpty }) };
        break;
      case 'max':
      case 'latest':
        accumulators[name] = { $max: compileExtremeValue({ field, isEmpty }) };
        break;
      case 'countDistinct':
        if (distinct === 'branch') {
          distinctBranches[`distinct_${name}`] = compileDistinctBranch({ path });
          break;
        }
        accumulators[name] = { $addToSet: { $cond: [isEmpty, '$$REMOVE', `$${path}`] } };
        addFields[name] = { $size: `$${name}` };
        break;
      case 'countEmpty':
        accumulators[name] = { $sum: { $cond: [isEmpty, 1, 0] } };
        break;
      case 'countNotEmpty':
        accumulators[name] = { $sum: { $cond: [isEmpty, 0, 1] } };
        break;
      case 'percentEmpty':
        accumulators[name] = { $sum: { $cond: [isEmpty, 1, 0] } };
        accumulators[`${name}_rows`] = { $sum: 1 };
        addFields[name] = {
          $cond: [{ $eq: [`$${name}_rows`, 0] }, 0, { $divide: [`$${name}`, `$${name}_rows`] }],
        };
        break;
      default:
        throw new Error(`MongoDBTableQuery aggregate "${fn}" is not supported.`);
    }
  });
  const stages = Object.keys(addFields).length > 0 ? [{ $addFields: addFields }] : [];
  return { accumulators, distinctBranches, stages, specs };
}

export default compileAggregates;
