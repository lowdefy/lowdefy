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

// Header and query parameter names that carry the client's address or identity, by substring.
// Sentry already filters names holding auth, token, session, key, cookie and similar.
const identifyingNames = ['forwarded', '-ip', 'remote-', 'via', '-user'];

// What the server SDK collects, pinned to what Sentry 10 sent with sendDefaultPii off, since
// Sentry 11's defaults send cookies (the session cookie among them), request and response bodies,
// the client IP and the data of database queries and AI calls. Lowdefy scrubs values it knows
// (secrets, the credentials a request marks); none of these is one. Request bodies are also kept
// off by the Http integration's maxRequestBodySize: 'none' in initSentryServer.
const sentryDataCollection = {
  userInfo: false,
  cookies: false,
  httpHeaders: { deny: identifyingNames },
  httpBodies: [],
  urlQueryParams: { deny: identifyingNames },
  graphQL: { document: true, variables: true },
  genAI: { inputs: false, outputs: false },
  mcp: { inputs: false, outputs: false },
  databaseQueryData: false,
  queues: false,
  stackFrameVariables: false,
  frameContextLines: 7,
};

export default sentryDataCollection;
