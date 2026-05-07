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

import { ConfigError } from '@lowdefy/errors';

const validIdPattern = /^[A-Za-z0-9\-_/:]+$/;

function validateId({ id, field, location, configKey }) {
  if (!validIdPattern.test(id)) {
    throw new ConfigError(
      `${field} "${id}"${location ? ` at ${location}` : ''} contains invalid characters. IDs must only contain A-Z, a-z, 0-9, "-", "_", "/", and ":".`,
      { configKey }
    );
  }
}

export default validateId;
