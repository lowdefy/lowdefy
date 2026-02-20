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

function errorToDisplayString(error) {
  if (typeof error === 'string') return error;
  if (error?.message === undefined) return String(error);

  const name = error.name || 'Error';
  let msg = `[${name}] ${error.message}`;

  if (error.received !== undefined) {
    try {
      msg = `${msg} Received: ${JSON.stringify(error.received)}`;
    } catch {
      msg = `${msg} Received: [unserializable]`;
    }
  }
  return msg;
}

export default errorToDisplayString;
