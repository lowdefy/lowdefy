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
import { isReserved } from '@lowdefy/helpers';

const validIdPattern = /^[A-Za-z0-9\-_/:]+$/;

function validateId({ id, field, location, configKey }) {
  if (!validIdPattern.test(id)) {
    throw new ConfigError(
      `${field} "${id}"${
        location ? ` at ${location}` : ''
      } contains invalid characters. IDs must only contain A-Z, a-z, 0-9, "-", "_", "/", and ":".`,
      { configKey }
    );
  }
  // The pattern above admits every reserved name - underscores and letters are in its allowed set.
  // A reserved id re-parents the plain-object registries that key on it - the engine's `requests`
  // and `requestConfig` maps, and the connection/websocket/notification/endpoint maps - so reject
  // it here where the config location is still in hand. Block ids do not reach this gate: they are
  // dot-paths, so the pattern above excludes them and they carry their own per-segment check.
  if (isReserved(id)) {
    throw new ConfigError(
      `${field} "${id}"${
        location ? ` at ${location}` : ''
      } is a reserved name and cannot be used as an id.`,
      { configKey }
    );
  }
}

export default validateId;
