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
 * 2. PluginError - Plugin code failures (operators, actions, blocks, requests)
 *    - Thrown: At plugin interface layer (NOT by plugins themselves)
 *    - Caught: Depends on context (collected or thrown)
 *    - Format: [Plugin Error] message. Received: {...} at location.
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
 *    - Not an error class, utility for conditional warning/error
 *    - Format: source:line\n[Config Warning] message
 */

import ConfigError from './ConfigError.js';
import ConfigWarning from './ConfigWarning.js';
import errorToDisplayString from './errorToDisplayString.js';
import LowdefyError from './LowdefyError.js';
import PluginError from './PluginError.js';
import ServiceError from './ServiceError.js';
import UserError from './UserError.js';

export {
  ConfigError,
  ConfigWarning,
  errorToDisplayString,
  LowdefyError,
  PluginError,
  ServiceError,
  UserError,
};
