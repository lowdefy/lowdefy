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

// The operators an MCP endpoint's view may use in pathParams and urlQuery. The
// result is the address of a page and is sent to the MCP client, so the list
// holds only _payload and _response, the call's own arguments and answer, and
// operators that shape a value and read nothing else: no secrets, no user, no
// state, no app code. The build refuses any other operator there and the
// server evaluates a view with these alone.
const mcpViewOperators = [
  '_payload',
  '_response',
  '_and',
  '_array',
  '_boolean',
  '_eq',
  '_get',
  '_if',
  '_if_none',
  '_ne',
  '_not',
  '_number',
  '_object',
  '_or',
  '_regex',
  '_string',
  '_switch',
  '_type',
  '_uri',
];

export default mcpViewOperators;
