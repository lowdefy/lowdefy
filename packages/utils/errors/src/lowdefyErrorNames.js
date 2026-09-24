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

// Keyed on the class name rather than `isLowdefyError`, because an error rebuilt
// from a caught value can drop `isLowdefyError` yet must keep its class name.
const lowdefyErrorNames = new Set([
  'ActionError',
  'AuthenticationError',
  'AuthorizationError',
  'BlockError',
  'BuildError',
  'ConfigError',
  'ConfigWarning',
  'LowdefyInternalError',
  'OperatorError',
  'PluginError',
  'RequestError',
  'ServiceError',
  'TwoFactorEnrolmentRequiredError',
  'UserError',
]);

export default lowdefyErrorNames;
