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

import { ServiceError } from '@lowdefy/errors';
import { type } from '@lowdefy/helpers';

const DRIVER_ERROR_NAMES = new Set(['MongoServerError', 'MongoError']);

// The keys of keyPattern name the indexed fields. keyValue is never read here -
// it holds the caller's document values, which must not reach the browser.
function duplicateKeyFields(error) {
  const fields = Object.keys(error.keyPattern ?? {});
  if (fields.length === 0) return 'the index';
  return fields.join(', ');
}

function mapByCode({ code, collectionName, error, requestType }) {
  switch (code) {
    case 11000:
    case 11001:
      return {
        message: `Duplicate key on collection "${collectionName}".`,
        hint: `A unique index on ${duplicateKeyFields(
          error
        )} already has a document with these values. Insert with MongoDBUpdateOne and upsert: true, or remove the existing document first.`,
      };
    case 2:
    case 9:
    case 16:
    case 40323:
    case 40324:
      return {
        message: `MongoDB rejected the ${requestType} command on collection "${collectionName}" as malformed.`,
        hint: 'A pipeline stage object must contain exactly one operator key, and every operator must be spelled with its leading $. Check the stage the message names.',
      };
    case 31254:
    case 40415:
      return {
        message: `MongoDB rejected an unknown field in the ${requestType} command on collection "${collectionName}".`,
        hint: 'Remove the field or check its spelling — MongoDB rejects fields it does not recognise on this command.',
      };
    case 13:
    case 18:
      return {
        message: `Not authorized to run ${requestType} on collection "${collectionName}".`,
        hint: "The database user in this connection's databaseUri does not have permission for this operation. Grant the role, or point the request at a connection whose user does.",
      };
    case 26:
      return {
        message: `Collection "${collectionName}" does not exist.`,
        hint: "Check the connection's properties.collection, or create the collection by writing to it first.",
      };
    case 50:
    case 89:
      return {
        message: `The ${requestType} on collection "${collectionName}" exceeded its time limit.`,
        hint: 'Add an index covering the filter and sort fields, or narrow the filter. A collection scan on a large collection will keep timing out.',
      };
    case 292:
      return {
        message: `The aggregation on collection "${collectionName}" exceeded MongoDB's memory limit.`,
        hint: 'Add allowDiskUse: true to the request options, or reduce what the $sort/$group stages hold in memory.',
      };
    default:
      return {
        message: `MongoDB rejected the ${requestType} on collection "${collectionName}" (code ${code}).`,
        hint: "Look up the code in the MongoDB error reference; the driver's full message is in the dev server terminal log.",
      };
  }
}

/**
 * Translates a MongoDB driver error into a ServiceError with a message that names the
 * collection and the operation, and a hint that says what to do about it. The driver's
 * own message is never quoted - it can carry document values - but it is preserved as
 * the cause, so the server log still shows it.
 *
 * @param {Error} error - The error the driver threw.
 * @param {Object} options
 * @param {Object} options.connection - The resolved connection properties.
 * @param {string} options.requestType - The request type name, e.g. 'MongoDBInsertOne'.
 * @returns {Error} A ServiceError, or the error unchanged when it is not a driver error.
 */
function mapMongoError(error, { connection, requestType }) {
  // Network, DNS, TLS and server-selection failures are already classified one layer
  // up; wrapping twice would bury the code.
  if (ServiceError.isServiceError(error)) return error;
  // A ConfigError or other Lowdefy error the request threw itself.
  if (error.isLowdefyError === true) return error;
  if (!DRIVER_ERROR_NAMES.has(error.name)) return error;

  const collectionName = type.isString(connection?.collection) ? connection.collection : 'unknown';
  const { message, hint } = mapByCode({ code: error.code, collectionName, error, requestType });
  return new ServiceError(message, {
    cause: error,
    service: 'MongoDB',
    code: error.code,
    hint,
  });
}

export default mapMongoError;
