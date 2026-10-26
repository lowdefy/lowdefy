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

// The parts of an origin ('https://app.example.com:8443') the _location operator reads.
function parseOrigin(origin) {
  const match = /^([a-z][a-z0-9+.-]*:)\/\/(([^:/]+)(?::(\d+))?)$/i.exec(origin);
  if (match === null) {
    throw new Error(`Native host origin is not a URL origin. Received ${JSON.stringify(origin)}.`);
  }
  return { host: match[2], hostname: match[3], port: match[4] ?? '', protocol: match[1] };
}

export default parseOrigin;
