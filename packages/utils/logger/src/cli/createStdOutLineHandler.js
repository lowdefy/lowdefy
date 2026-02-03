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

function createStdOutLineHandler({ context }) {
  const ui =
    context?.logger?.ui ??
    context?.print ?? {
      log: (text) => console.log(text),
      info: (text) => console.info(text),
      warn: (text) => console.warn(text),
      error: (text) => console.error(text),
      debug: (text) => console.debug(text),
      link: (text) => console.info(text),
      spin: (text) => console.log(text),
      succeed: (text) => console.log(text),
    };

  function stdOutLineHandler(line) {
    try {
      const { print, msg, source, err } = JSON.parse(line);

      // Extract source from err (pino error serialization) or top-level (merging object)
      const resolvedSource = err?.source ?? source;

      // Error/warn with source: show source link (blue) before the message
      if (resolvedSource && (print === 'error' || print === 'warn')) {
        ui.link(resolvedSource);
      }

      if (msg != null && msg !== '' && msg !== 'undefined') {
        ui[print]?.(msg);
      }
    } catch (error) {
      ui.log(line);
    }
  }
  return stdOutLineHandler;
}

export default createStdOutLineHandler;
