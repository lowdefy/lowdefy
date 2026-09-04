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

import { validate } from '@lowdefy/ajv';
import { type } from '@lowdefy/helpers';
import { ConfigWarning, shouldSuppressBuildCheck } from '@lowdefy/errors';

import findConfigKey from '../utils/findConfigKey.js';
import lowdefySchema from '../lowdefySchema.js';

function getValueAtPath(obj, pathParts) {
  let current = obj;
  for (const part of pathParts) {
    if (type.isNone(current)) return undefined;
    current = type.isArray(current) ? current[parseInt(part, 10)] : current[part];
  }
  return current;
}

// Schema validation emits warnings rather than errors. Focused validations
// in each build step (validateBlock, buildConnections, buildEvents, etc.)
// provide better error messages with full context (pageId, blockId, etc.).
// Schema warnings still surface useful hints like typos caught by
// additionalProperties and property type mismatches.
function testSchema({ components, context }) {
  const { valid, errors } = validate({
    schema: lowdefySchema,
    data: components,
    returnErrors: true,
  });

  if (!valid) {
    // Filter out anyOf/oneOf cascade errors - these are always accompanied by
    // more specific validation errors and just add noise
    let filteredErrors = errors.filter(
      (error) => error.keyword !== 'anyOf' && error.keyword !== 'oneOf'
    );

    // Hierarchical deduplication: if an error exists at a child path,
    // filter out errors at parent paths (prefer more specific errors)
    filteredErrors = filteredErrors.filter((error) => {
      const hasChildError = filteredErrors.some(
        (other) => other !== error && other.instancePath.startsWith(error.instancePath + '/')
      );
      return !hasChildError;
    });

    // Same-path deduplication: only show one error per unique path (multiple
    // errors at one path are usually the branches of an anyOf/oneOf, each
    // reporting that the value is not its own type).
    //
    // ajv-errors replaces the branch keyword itself with the schema's
    // errorMessage, and that message is the only one that lists the legal forms
    // (collectionField, connection.tenant) - where "must be string" from the
    // first branch is actively misleading. So when a message replaced an
    // anyOf/oneOf at this path, it wins the path.
    const branchMessagePaths = new Set(
      filteredErrors
        .filter(
          (error) =>
            error.keyword === 'errorMessage' &&
            (error.params?.errors ?? []).some(
              (replaced) => replaced.keyword === 'anyOf' || replaced.keyword === 'oneOf'
            )
        )
        .map((error) => error.instancePath)
    );
    filteredErrors = filteredErrors.filter(
      (error) => !branchMessagePaths.has(error.instancePath) || error.keyword === 'errorMessage'
    );

    const seenPaths = new Set();
    filteredErrors = filteredErrors.filter((error) => {
      if (seenPaths.has(error.instancePath)) {
        return false;
      }
      seenPaths.add(error.instancePath);
      return true;
    });

    filteredErrors.forEach((error) => {
      const instancePath = error.instancePath.split('/').slice(1).filter(Boolean);
      const configKey = findConfigKey({ components, instancePath });

      const propertyName = instancePath[instancePath.length - 1];
      let message = error.message;
      if (error.params?.additionalProperty) {
        message = `${message} - "${error.params.additionalProperty}"`;
      } else if (propertyName && error.keyword !== 'errorMessage') {
        message = `"${propertyName}" ${message}`;
      }

      const received = getValueAtPath(components, instancePath);
      const warning = new ConfigWarning(message, { configKey, checkSlug: 'schema', received });
      if (!shouldSuppressBuildCheck(warning, context.keyMap)) {
        context.handleWarning(warning);
      }
    });
  }
}

export default testSchema;
