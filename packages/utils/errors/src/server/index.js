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
 * @lowdefy/errors/server - Server-side error classes.
 *
 * Re-exports base error classes for server runtime use.
 * Location resolution is handled by the error logging middleware
 * which has access to refMap.
 *
 * @example
 * import { ConfigError, PluginError, ServiceError } from '@lowdefy/errors/server';
 */

import ConfigError from '../ConfigError.js';
import ConfigWarning from '../ConfigWarning.js';
import LowdefyError from '../LowdefyError.js';
import PluginError from '../PluginError.js';
import ServiceError from '../ServiceError.js';

export { ConfigError, ConfigWarning, LowdefyError, PluginError, ServiceError };
