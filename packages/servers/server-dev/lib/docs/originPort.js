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

const DEFAULT_PORTS = { 'http:': '80', 'https:': '443' };

// The port a URL reaches, which is its scheme's default when it names none.
function originPort({ url }) {
  return url.port === '' ? DEFAULT_PORTS[url.protocol] : url.port;
}

export default originPort;
