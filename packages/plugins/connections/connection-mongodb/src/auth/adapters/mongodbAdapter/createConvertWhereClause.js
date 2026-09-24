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

import { LowdefyInternalError } from '@lowdefy/errors';

import escapeForMongoRegex from './escapeForMongoRegex.js';
import insensitiveContains from './insensitiveContains.js';
import insensitiveEndsWith from './insensitiveEndsWith.js';
import insensitiveEq from './insensitiveEq.js';
import insensitiveIn from './insensitiveIn.js';
import insensitiveNe from './insensitiveNe.js';
import insensitiveNotIn from './insensitiveNotIn.js';
import insensitiveStartsWith from './insensitiveStartsWith.js';

// Converts a BetterAuth where array into a MongoDB filter document.
// Adapted from @better-auth/mongo-adapter@1.6.23 - see mongodbAdapter.js for
// provenance.
function createConvertWhereClause({ getFieldAttributes, getFieldName, serializeId }) {
  return function convertWhereClause({ model, where }) {
    if (!where.length) {
      return {};
    }
    const conditions = where.map((w) => {
      const {
        field: whereField,
        value,
        operator = 'eq',
        connector = 'AND',
        mode = 'sensitive',
      } = w;
      let field = getFieldName({ model, field: whereField });
      if (field === 'id') {
        field = '_id';
      }
      const fieldAttributes = getFieldAttributes({ model, field: whereField });
      // Id fields are BSON ids - regex-based insensitive matching never
      // applies to them, only to string values.
      const isInsensitive =
        !(field === '_id' || fieldAttributes?.references?.field === 'id') &&
        mode === 'insensitive' &&
        (typeof value === 'string' ||
          (Array.isArray(value) && value.every((item) => typeof item === 'string')));
      const serialize = (item) => serializeId({ field, model, value: item });
      let condition;
      switch (operator.toLowerCase()) {
        case 'eq':
          if (isInsensitive && typeof value === 'string') {
            condition = insensitiveEq({ field, value });
          } else {
            condition = { [field]: serialize(value) };
          }
          break;
        case 'in':
          if (isInsensitive && Array.isArray(value)) {
            condition = insensitiveIn({ field, values: value });
          } else {
            condition = {
              [field]: { $in: Array.isArray(value) ? value.map(serialize) : [serialize(value)] },
            };
          }
          break;
        case 'not_in':
          if (isInsensitive && Array.isArray(value)) {
            condition = insensitiveNotIn({ field, values: value });
          } else {
            condition = {
              [field]: { $nin: Array.isArray(value) ? value.map(serialize) : [serialize(value)] },
            };
          }
          break;
        case 'gt':
          condition = { [field]: { $gt: serialize(value) } };
          break;
        case 'gte':
          condition = { [field]: { $gte: serialize(value) } };
          break;
        case 'lt':
          condition = { [field]: { $lt: serialize(value) } };
          break;
        case 'lte':
          condition = { [field]: { $lte: serialize(value) } };
          break;
        case 'ne':
          if (isInsensitive && typeof value === 'string') {
            condition = insensitiveNe({ field, value });
          } else {
            condition = { [field]: { $ne: serialize(value) } };
          }
          break;
        case 'contains':
          if (isInsensitive) {
            condition = insensitiveContains({ field, value });
          } else {
            condition = { [field]: { $regex: `.*${escapeForMongoRegex(value)}.*` } };
          }
          break;
        case 'starts_with':
          if (isInsensitive) {
            condition = insensitiveStartsWith({ field, value });
          } else {
            condition = { [field]: { $regex: `^${escapeForMongoRegex(value)}` } };
          }
          break;
        case 'ends_with':
          if (isInsensitive) {
            condition = insensitiveEndsWith({ field, value });
          } else {
            condition = { [field]: { $regex: `${escapeForMongoRegex(value)}$` } };
          }
          break;
        default:
          throw new LowdefyInternalError(
            'MongoDB auth adapter received an unsupported where operator.'
          );
      }
      return { condition, connector };
    });
    if (conditions.length === 1) {
      return conditions[0].condition;
    }
    const andConditions = conditions.filter((c) => c.connector === 'AND').map((c) => c.condition);
    const orConditions = conditions.filter((c) => c.connector === 'OR').map((c) => c.condition);
    const clause = {};
    if (andConditions.length) {
      clause.$and = andConditions;
    }
    if (orConditions.length) {
      clause.$or = orConditions;
    }
    return clause;
  };
}

export default createConvertWhereClause;
