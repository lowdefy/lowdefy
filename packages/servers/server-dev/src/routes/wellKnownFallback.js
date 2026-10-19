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

// RFC 8615 well-known URIs are machine-facing: a path this deployment does not
// serve must answer 404, never the app's HTML shell. Serving 200 HTML breaks
// clients that probe discovery documents - an MCP client's OAuth probe, for
// example, fails with "Failed to parse JSON" instead of learning there is no
// auth to discover. Mounted after the real discovery documents, before the
// page catch-all.
function wellKnownFallbackHandler(c) {
  return c.json(
    { name: 'NotFoundError', message: `No well-known document at ${c.req.path}.` },
    404
  );
}

export default wellKnownFallbackHandler;
