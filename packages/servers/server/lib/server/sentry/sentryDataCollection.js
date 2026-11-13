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

import sentryHttpDataCollection from '../../sentry/sentryHttpDataCollection.js';

// What the server SDK collects: the request data both SDKs pin (sentryHttpDataCollection), and
// none of the data of database queries, queue tasks, AI or MCP calls, or stack-frame variables,
// all of which Sentry 11 sends by default. Lowdefy scrubs values it knows (secrets, the
// credentials a request marks); none of these is one. GraphQL documents are sent with their
// literal values replaced by Sentry; their variables are not sent.
const sentryDataCollection = {
  ...sentryHttpDataCollection,
  graphQL: { document: true, variables: false },
  genAI: { inputs: false, outputs: false },
  mcp: { inputs: false, outputs: false },
  databaseQueryData: false,
  queues: false,
  stackFrameVariables: false,
  frameContextLines: 7,
};

export default sentryDataCollection;
