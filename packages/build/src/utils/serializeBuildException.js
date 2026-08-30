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

// Error.prototype.message is non-enumerable, so JSON.stringify(error) drops it
// (while enumerable fields like configKey/source survive). Build a plain,
// JSON-serializable summary instead - no stack, no cause, no `received`
// (arbitrary config values that may be huge or circular).
function serializeBuildException(exception) {
  return {
    message: exception.message,
    name: exception.name,
    source: exception.source ?? null,
    config: exception.config ?? null,
    configKey: exception.configKey ?? null,
    checkSlug: exception.checkSlug ?? null,
    prodError: exception.prodError === true,
  };
}

export default serializeBuildException;
