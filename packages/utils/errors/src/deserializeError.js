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

import ConfigError from './ConfigError.js';
import PluginError from './PluginError.js';
import ServiceError from './ServiceError.js';

const errorTypes = {
  ConfigError,
  PluginError,
  ServiceError,
};

/**
 * Deserializes error data back into the appropriate error class.
 * @param {Object} data - Serialized error data with ~err type marker
 * @returns {Error} The deserialized error instance
 */
function deserializeError(data) {
  const ErrorClass = errorTypes[data['~err']];
  if (!ErrorClass) {
    throw new Error(`Unknown error type: ${data['~err']}`);
  }
  return ErrorClass.deserialize(data);
}

export default deserializeError;
