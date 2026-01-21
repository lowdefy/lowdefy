/*
  Copyright 2020-2024 Lowdefy, Inc

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
import { ConfigError } from '@lowdefy/node-utils';

import findConfigKey from '../utils/findConfigKey.js';
import lowdefySchema from '../lowdefySchema.js';

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
        (other) =>
          other !== error &&
          other.instancePath.startsWith(error.instancePath + '/')
      );
      return !hasChildError;
    });

    // Same-path deduplication: only show first error per unique path
    // (multiple errors at same path are usually cascade errors from schema branches)
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

      let message = error.message;
      if (error.params?.additionalProperty) {
        message = `${message} - "${error.params.additionalProperty}"`;
      }

      const configError = new ConfigError({ message, configKey, context });
      if (!configError.suppressed) {
        if (!context.errors) {
          // If no error collection array, throw immediately (fallback for tests)
          throw new Error(configError.message);
        }
        context.errors.push(configError.message);
        context.logger.error(configError.message);
      }
    });
  }
}

export default testSchema;
