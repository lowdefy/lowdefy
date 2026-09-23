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

import ActionError from './ActionError.js';
import AuthenticationError from './AuthenticationError.js';
import AuthorizationError from './AuthorizationError.js';
import BlockError from './BlockError.js';
import BuildError from './BuildError.js';
import ConfigError from './ConfigError.js';
import ConfigWarning from './ConfigWarning.js';
import LowdefyInternalError from './LowdefyInternalError.js';
import OperatorError from './OperatorError.js';
import PluginError from './PluginError.js';
import RequestError from './RequestError.js';
import ServiceError from './ServiceError.js';
import TwoFactorEnrolmentRequiredError from './TwoFactorEnrolmentRequiredError.js';
import UserError from './UserError.js';

// Name to class, for rebuilding an error whose class identity is gone but whose
// name survived - a serializer round trip, or a caught error being reshaped.
const lowdefyErrorTypes = {
  ActionError,
  AuthenticationError,
  AuthorizationError,
  BlockError,
  BuildError,
  ConfigError,
  ConfigWarning,
  LowdefyInternalError,
  OperatorError,
  PluginError,
  RequestError,
  ServiceError,
  TwoFactorEnrolmentRequiredError,
  UserError,
};

export default lowdefyErrorTypes;
