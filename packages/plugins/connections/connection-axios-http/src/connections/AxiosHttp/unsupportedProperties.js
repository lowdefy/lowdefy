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

// Axios options that choose how a connection is made. AxiosHttp sets each of them itself, since
// any of them could open a socket the address check never sees (a fetch adapter, a custom
// transport or agent, a lookup), so neither a connection nor a request may set them.
const unsupportedProperties = [
  'adapter',
  'beforeRedirect',
  'httpAgent',
  'httpsAgent',
  'lookup',
  'transport',
];

export default unsupportedProperties;
