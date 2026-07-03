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

import { createAdapterFactory } from 'better-auth/adapters';
import { ObjectId, UUID } from 'mongodb';

import createCustomAdapter from './createCustomAdapter.js';

// Adapted from @better-auth/mongo-adapter@1.6.23 (MIT License,
// Copyright (c) better-auth contributors,
// https://github.com/better-auth/better-auth). Vendored because the published
// adapter offers no way to enable native sub-document storage for json
// fields. Differences from upstream:
// - supportsJSON is on: json additionalFields (user.attributes,
//   member.attributes, invitation.attributes) are stored as native
//   sub-documents so native reads can filter and aggregate on their contents.
// - customTransformOutput parses string values in json fields, so rows
//   written as JSON strings before native storage shipped still read back as
//   objects.
// - Transactions are not supported (matching upstream behavior when no
//   MongoClient is passed) - standalone MongoDB deployments have no sessions.
function mongodbAdapter({ db }) {
  return createAdapterFactory({
    config: {
      adapterId: 'mongodb-adapter',
      adapterName: 'Lowdefy MongoDB Adapter',
      usePlural: false,
      debugLogs: false,
      mapKeysTransformInput: { id: '_id' },
      mapKeysTransformOutput: { _id: 'id' },
      supportsArrays: true,
      supportsJSON: true,
      supportsNumericIds: false,
      transaction: false,
      customTransformInput({ action, data, fieldAttributes, field, options }) {
        if (field !== '_id' && fieldAttributes.references?.field !== 'id') {
          return data;
        }
        const generateId = options.advanced?.database?.generateId;
        // A custom generateId function stores plain string ids - no coercion.
        if (typeof generateId === 'function') {
          return data;
        }
        if (action !== 'create' && action !== 'update') {
          return data;
        }
        const IdClass = generateId === 'uuid' ? UUID : ObjectId;
        if (data instanceof IdClass) {
          return data;
        }
        if (Array.isArray(data)) {
          return data.map((value) => {
            if (typeof value === 'string') {
              try {
                return new IdClass(value);
              } catch {
                return value;
              }
            }
            return value;
          });
        }
        if (typeof data === 'string') {
          try {
            return new IdClass(data);
          } catch {
            return data;
          }
        }
        if (fieldAttributes?.references?.field === 'id' && !fieldAttributes?.required && data === null) {
          return null;
        }
        if (action === 'update') {
          return data;
        }
        return new IdClass();
      },
      customTransformOutput({ data, field, fieldAttributes }) {
        if (field === 'id' || fieldAttributes.references?.field === 'id') {
          if (data instanceof UUID) {
            return data.toString();
          }
          if (data instanceof ObjectId) {
            return data.toHexString();
          }
          if (Array.isArray(data)) {
            return data.map((value) => {
              if (value instanceof UUID) {
                return value.toString();
              }
              if (value instanceof ObjectId) {
                return value.toHexString();
              }
              return value;
            });
          }
          return data;
        }
        // supportsJSON disables the factory's parse-on-read, so json fields
        // written as JSON strings before native sub-document storage shipped
        // are parsed here instead.
        if (fieldAttributes.type === 'json' && typeof data === 'string') {
          try {
            return JSON.parse(data);
          } catch {
            return data;
          }
        }
        return data;
      },
      customIdGenerator() {
        return new ObjectId().toString();
      },
    },
    adapter: createCustomAdapter({ db }),
  });
}

export default mongodbAdapter;
