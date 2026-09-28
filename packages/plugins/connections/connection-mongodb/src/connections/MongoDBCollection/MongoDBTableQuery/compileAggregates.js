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

// Accumulators are named a0, a1, ... because field keys may contain dots, which a $group
// output field can not. `specs` maps the names back to field keys (readAggregates).
function compileAggregates({ aggregates, fieldsByKey }) {
  const accumulators = {};
  const addFields = {};
  const specs = [];
  Object.entries(aggregates).forEach(([key, fn], index) => {
    const name = `a${index}`;
    const { path } = fieldsByKey.get(key);
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
        accumulators[name] = { $min: `$${path}` };
        break;
      case 'max':
      case 'latest':
        accumulators[name] = { $max: `$${path}` };
        break;
      case 'countDistinct':
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
  return { accumulators, stages, specs };
}

export default compileAggregates;
