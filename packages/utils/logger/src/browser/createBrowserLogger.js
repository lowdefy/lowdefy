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

function formatBrowserError(errorOrMessage) {
  if (typeof errorOrMessage === 'string') return errorOrMessage;
  if (errorOrMessage?.print) return errorOrMessage.print();
  if (errorOrMessage && (errorOrMessage.name || errorOrMessage.message !== undefined)) {
    const name = errorOrMessage.name || 'Error';
    const message = errorOrMessage.message ?? '';
    return `[${name}] ${message}`;
  }
  return errorOrMessage;
}

function createBrowserLogger() {
  return {
    error: (errorOrMessage, ...args) => {
      if (args.length > 0) {
        console.error(errorOrMessage, ...args);
        return;
      }
      console.error(formatBrowserError(errorOrMessage));
    },
    warn: (...args) => console.warn(...args),
    info: (...args) => console.info(...args),
    debug: (...args) => console.debug(...args),
  };
}

export default createBrowserLogger;
