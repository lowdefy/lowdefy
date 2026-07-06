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

import createConvertWhereClause from './createConvertWhereClause.js';
import createSerializeId from './createSerializeId.js';

// Returns the CustomAdapter creator consumed by BetterAuth's
// createAdapterFactory. The creator signature ({ getFieldAttributes,
// getFieldName, schema, getDefaultModelName, options }) is fixed by the
// BetterAuth adapter API.
// Adapted from @better-auth/mongo-adapter@1.6.23 - see mongodbAdapter.js for
// provenance.
function createCustomAdapter({ db }) {
  return function customAdapter({
    getFieldAttributes,
    getFieldName,
    schema,
    getDefaultModelName,
    options,
  }) {
    const generateId = options.advanced?.database?.generateId;
    const serializeId = createSerializeId({
      customIdGenerator: typeof generateId === 'function' ? generateId : undefined,
      getDefaultModelName,
      schema,
      useUUIDs: generateId === 'uuid',
    });
    const convertWhereClause = createConvertWhereClause({
      getFieldAttributes,
      getFieldName,
      serializeId,
    });

    function matchStage({ model, where }) {
      if (!where) {
        return { $match: {} };
      }
      return { $match: convertWhereClause({ model, where }) };
    }

    function projectStage({ model, select, join }) {
      const projection = {};
      select.forEach((field) => {
        projection[getFieldName({ field, model })] = 1;
      });
      if (join) {
        Object.keys(join).forEach((joinedModel) => {
          projection[joinedModel] = 1;
        });
      }
      return { $project: projection };
    }

    // The join pipeline is kept for fidelity with the upstream
    // @better-auth/mongo-adapter: at better-auth 1.6.23 the core only passes
    // `join` when options.experimental.joins is enabled, which Lowdefy does
    // not set - core serves joins through its fallback path instead.
    function pushJoinStages({ pipeline, model, isUnique, joinedModel, joinConfig, shouldLimit }) {
      const localField = getFieldName({ field: joinConfig.on.from, model });
      const foreignField = getFieldName({ field: joinConfig.on.to, model: joinedModel });
      const localFieldName = localField === 'id' ? '_id' : localField;
      const foreignFieldName = foreignField === 'id' ? '_id' : foreignField;
      const limit = joinConfig.limit ?? options.advanced?.database?.defaultFindManyLimit ?? 100;
      if (shouldLimit && limit > 0) {
        pipeline.push({
          $lookup: {
            from: joinedModel,
            let: { localFieldValue: `$${localFieldName}` },
            pipeline: [
              { $match: { $expr: { $eq: [`$${foreignFieldName}`, '$$localFieldValue'] } } },
              { $limit: limit },
            ],
            as: joinedModel,
          },
        });
      } else {
        pipeline.push({
          $lookup: {
            from: joinedModel,
            localField: localFieldName,
            foreignField: foreignFieldName,
            as: joinedModel,
          },
        });
      }
      if (isUnique) {
        pipeline.push({ $unwind: { path: `$${joinedModel}`, preserveNullAndEmptyArrays: true } });
      }
    }

    return {
      async create({ model, data }) {
        const result = await db.collection(model).insertOne(data);
        return { _id: result.insertedId.toString(), ...data };
      },
      async findOne({ model, where, select, join }) {
        const pipeline = [matchStage({ model, where })];
        if (join) {
          for (const [joinedModel, joinConfig] of Object.entries(join)) {
            const isUnique =
              schema[getDefaultModelName(joinedModel)]?.fields[joinConfig.on.to]?.unique === true;
            pushJoinStages({
              pipeline,
              model,
              isUnique,
              joinedModel,
              joinConfig,
              shouldLimit: !isUnique && joinConfig.limit !== undefined,
            });
          }
        }
        if (select) {
          pipeline.push(projectStage({ model, select, join }));
        }
        pipeline.push({ $limit: 1 });
        const res = await db.collection(model).aggregate(pipeline).toArray();
        if (!res || res.length === 0) {
          return null;
        }
        return res[0];
      },
      async findMany({ model, where, limit, select, offset, sortBy, join }) {
        const pipeline = [matchStage({ model, where })];
        if (join) {
          for (const [joinedModel, joinConfig] of Object.entries(join)) {
            const isUnique =
              getFieldAttributes({ model: joinedModel, field: joinConfig.on.to })?.unique === true;
            pushJoinStages({
              pipeline,
              model,
              isUnique,
              joinedModel,
              joinConfig,
              shouldLimit: joinConfig.relation !== 'one-to-one' && joinConfig.limit !== undefined,
            });
          }
        }
        if (select?.length && select.length > 0) {
          pipeline.push(projectStage({ model, select, join }));
        }
        if (sortBy) {
          // id is stored as _id, like the where-clause mapping in
          // createConvertWhereClause.
          const sortField = getFieldName({ field: sortBy.field, model });
          pipeline.push({
            $sort: {
              [sortField === 'id' ? '_id' : sortField]: sortBy.direction === 'desc' ? -1 : 1,
            },
          });
        }
        if (offset) {
          pipeline.push({ $skip: offset });
        }
        if (limit) {
          pipeline.push({ $limit: limit });
        }
        return db.collection(model).aggregate(pipeline).toArray();
      },
      async count({ model, where }) {
        const pipeline = [matchStage({ model, where }), { $count: 'total' }];
        const res = await db.collection(model).aggregate(pipeline).toArray();
        if (!res || res.length === 0) {
          return 0;
        }
        return res[0]?.total ?? 0;
      },
      async update({ model, where, update }) {
        const clause = convertWhereClause({ model, where });
        const result = await db
          .collection(model)
          .findOneAndUpdate(
            clause,
            { $set: update },
            { returnDocument: 'after', includeResultMetadata: true }
          );
        return result?.value ?? null;
      },
      async updateMany({ model, where, update }) {
        const clause = convertWhereClause({ model, where });
        const result = await db.collection(model).updateMany(clause, { $set: update });
        return result.modifiedCount;
      },
      async delete({ model, where }) {
        const clause = convertWhereClause({ model, where });
        await db.collection(model).deleteOne(clause);
      },
      async deleteMany({ model, where }) {
        const clause = convertWhereClause({ model, where });
        const result = await db.collection(model).deleteMany(clause);
        return result.deletedCount;
      },
      async consumeOne({ model, where }) {
        const clause = convertWhereClause({ model, where });
        const result = await db
          .collection(model)
          .findOneAndDelete(clause, { includeResultMetadata: true });
        return result?.value ?? null;
      },
      async incrementOne({ model, where, increment, set }) {
        const clause = convertWhereClause({ model, where });
        const update = {};
        if (Object.keys(increment).length > 0) {
          update.$inc = increment;
        }
        if (set && Object.keys(set).length > 0) {
          update.$set = set;
        }
        const result = await db.collection(model).findOneAndUpdate(clause, update, {
          returnDocument: 'after',
          includeResultMetadata: true,
        });
        return result?.value ?? null;
      },
    };
  };
}

export default createCustomAdapter;
