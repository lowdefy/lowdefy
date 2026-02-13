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
 * @lowdefy/errors/build - Build-time error classes.
 *
 * Use this entry point for build-time code that needs synchronous location resolution
 * using keyMap and refMap from the build context.
 *
 * @example
 * import { ConfigError, ConfigWarning, shouldSuppressBuildCheck } from '@lowdefy/errors/build';
 *
 * throw new ConfigError({
 *   message: 'Connection id missing.',
 *   configKey: block['~k'],
 * });
 */

import ConfigError from '../ConfigError.js';
import ConfigWarning from './ConfigWarning.js';
import resolveConfigLocation from './resolveConfigLocation.js';
import resolveErrorConfigLocation from './resolveErrorConfigLocation.js';
import resolveErrorLocation from './resolveErrorLocation.js';
import shouldSuppressBuildCheck, { VALID_CHECK_SLUGS } from './shouldSuppressBuildCheck.js';
import errorToDisplayString from '../errorToDisplayString.js';
import LowdefyError from '../LowdefyError.js';
import PluginError from '../PluginError.js';
import ServiceError from '../ServiceError.js';

export {
  ConfigError,
  ConfigWarning,
  errorToDisplayString,
  LowdefyError,
  PluginError,
  resolveConfigLocation,
  resolveErrorConfigLocation,
  resolveErrorLocation,
  ServiceError,
  shouldSuppressBuildCheck,
  VALID_CHECK_SLUGS,
};
