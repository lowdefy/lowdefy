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

/**
 * @lowdefy/errors/client - Client-side error classes.
 *
 * Use this entry point for client-side (browser) code that needs async location resolution.
 *
 * @example
 * import { ConfigError, PluginError } from '@lowdefy/errors/client';
 *
 * const error = new ConfigError({ message: 'Invalid operator', configKey });
 * await error.resolve(lowdefy);
 */

import ConfigError from './ConfigError.js';
import ConfigWarning from '../ConfigWarning.js';
import deserializeError from '../deserializeError.js';
import LowdefyError from './LowdefyError.js';
import PluginError from '../PluginError.js';
import ServiceError from '../ServiceError.js';
import UserError from '../UserError.js';

export {
  ConfigError,
  ConfigWarning,
  deserializeError,
  LowdefyError,
  PluginError,
  ServiceError,
  UserError,
};
