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

/**
 * @lowdefy/errors - Consistent error handling across build, server, and client.
 *
 * Error Hierarchy:
 *
 * 1. LowdefyError - Internal Lowdefy bugs, unexpected conditions
 *    - Thrown: Anywhere inside Lowdefy internals
 *    - Caught: Top-level catch in build/server/client
 *    - Format: [Lowdefy Error] message + stack trace
 *
 * 2. PluginError - Base class for plugin failures. Use typed subclasses:
 *    - OperatorError, ActionError, BlockError, RequestError
 *    - Thrown: At plugin interface layer (NOT by plugins themselves)
 *    - Caught: Depends on context (collected or thrown)
 *    - Format: [OperatorError] message. Received: {...} at location.
 *
 * 3. ServiceError - External service failures (network, timeout, 5xx)
 *    - Thrown: At plugin interface layer when external service fails
 *    - Caught: Request handlers, connection handlers
 *    - Format: [Service Error] message
 *
 * 4. ConfigError - Config validation errors (invalid YAML, schema violations)
 *    - Thrown: Build validation, schema checks
 *    - Caught: Build orchestrator
 *    - Format: source:line\n[Config Error] message
 *
 * 5. ConfigWarning - Config inconsistencies (warning in dev, error in prod)
 *    - Extends ConfigError with name override
 *    - Format: source:line\n[ConfigWarning] message
 *
 * 6. UserError - Expected user interaction (validation, throws), client-only
 *    - Thrown: Action plugins for expected user errors
 *    - Caught: Browser console only, never sent to server
 *    - Format: [User Error] message
 *
 * Location Resolution Utilities:
 *   resolveConfigLocation     - Sync: configKey → {source, config} via keyMap/refMap
 *   resolveErrorLocation      - Sync: unified resolver (configKey or filePath/lineNumber)
 *   loadAndResolveErrorLocation - Async: reads keyMap/refMap files at runtime
 *   shouldSuppressBuildCheck   - Check ~ignoreBuildChecks in parent chain
 */

import ActionError from './ActionError.js';
import BlockError from './BlockError.js';
import BuildError from './BuildError.js';
import ConfigError from './ConfigError.js';
import ConfigWarning from './ConfigWarning.js';
import errorToDisplayString from './errorToDisplayString.js';
import LowdefyError from './LowdefyError.js';
import OperatorError from './OperatorError.js';
import PluginError from './PluginError.js';
import RequestError from './RequestError.js';
import resolveConfigLocation from './resolveConfigLocation.js';
import loadAndResolveErrorLocation from './loadAndResolveErrorLocation.js';
import resolveErrorLocation from './resolveErrorLocation.js';
import ServiceError from './ServiceError.js';
import shouldSuppressBuildCheck, { VALID_CHECK_SLUGS } from './shouldSuppressBuildCheck.js';
import UserError from './UserError.js';

export {
  ActionError,
  BlockError,
  BuildError,
  ConfigError,
  ConfigWarning,
  errorToDisplayString,
  LowdefyError,
  OperatorError,
  PluginError,
  RequestError,
  resolveConfigLocation,
  loadAndResolveErrorLocation,
  resolveErrorLocation,
  ServiceError,
  shouldSuppressBuildCheck,
  UserError,
  VALID_CHECK_SLUGS,
};
