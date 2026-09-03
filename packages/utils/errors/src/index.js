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
 * 1. LowdefyInternalError - Internal Lowdefy bugs, unexpected conditions
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
 * 6. UserError - An expected outcome of user interaction, never a config or system fault
 *    - Thrown: Client-side Throw and Validate actions; server-side controlThrow (routine :throw)
 *      and controlReject (routine :reject); client auth methods when the auth server rejects
 *      the attempt (4xx: wrong password, expired or used link, invalid code, stale OAuth query)
 *    - Caught: Caller of the action/resolver; the message is shown to the user and catch actions
 *      run, but it logs to the browser console only - never posted to /api/client-error, never
 *      logged on the server at error level, never resolved to a config location
 *    - Format: [User Error] message
 *
 * 7. AuthenticationError - Unauthenticated request to a protected endpoint
 *    - Thrown: API/request authorization when no caller resolved
 *    - Caught: Server error handlers, before structured logging and Sentry (401)
 *    - Format: [AuthenticationError] message
 *
 * 8. TwoFactorEnrolmentRequiredError - Authorized caller with no enrolled second factor
 *    - Thrown: The authorization gate, when auth.twoFactor.required is set and the caller is unenrolled
 *    - Caught: Server error handlers, before structured logging and Sentry (403)
 *    - Format: [TwoFactorEnrolmentRequiredError] message
 *
 * 9. AuthorizationError - Authenticated caller refused by an authorization gate (wrong roles)
 *    - Thrown: Request, endpoint, agent, websocket and auth-step authorization gates
 *    - Caught: Server error handlers, before structured logging and Sentry (403)
 *    - Format: [AuthorizationError] message
 *
 * Location Resolution Utilities:
 *   resolveConfigLocation     - Sync: configKey → {source, config} via keyMap/refMap
 *   resolveErrorLocation      - Sync: unified resolver (configKey or filePath/lineNumber)
 *   loadAndResolveErrorLocation - Async: reads keyMap/refMap files at runtime
 *   shouldSuppressBuildCheck   - Check ~ignoreBuildChecks in parent chain
 */

import ActionError from './ActionError.js';
import AuthenticationError from './AuthenticationError.js';
import AuthorizationError from './AuthorizationError.js';
import BlockError from './BlockError.js';
import BuildError from './BuildError.js';
import ConfigError from './ConfigError.js';
import ConfigWarning from './ConfigWarning.js';
import errorToDisplayString from './errorToDisplayString.js';
import LowdefyInternalError from './LowdefyInternalError.js';
import OperatorError from './OperatorError.js';
import PluginError from './PluginError.js';
import RequestError from './RequestError.js';
import resolveConfigLocation from './resolveConfigLocation.js';
import loadAndResolveErrorLocation from './loadAndResolveErrorLocation.js';
import resolveErrorLocation from './resolveErrorLocation.js';
import ServiceError from './ServiceError.js';
import shouldSuppressBuildCheck from './shouldSuppressBuildCheck.js';
import VALID_CHECK_SLUGS from './checkSlugs.js';
import TwoFactorEnrolmentRequiredError from './TwoFactorEnrolmentRequiredError.js';
import UserError from './UserError.js';

export {
  ActionError,
  AuthenticationError,
  AuthorizationError,
  BlockError,
  BuildError,
  ConfigError,
  ConfigWarning,
  errorToDisplayString,
  LowdefyInternalError,
  OperatorError,
  PluginError,
  RequestError,
  resolveConfigLocation,
  loadAndResolveErrorLocation,
  resolveErrorLocation,
  ServiceError,
  shouldSuppressBuildCheck,
  TwoFactorEnrolmentRequiredError,
  UserError,
  VALID_CHECK_SLUGS,
};
