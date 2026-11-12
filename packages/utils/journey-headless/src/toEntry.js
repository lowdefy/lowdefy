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

// An error the error sink took, as an error entry the shared invariants read
// ({ message, name, source }), with the request or endpoint a server fault came from.
function toEntry({ call, error }) {
  return {
    endpointId: call?.endpointId ?? null,
    message: error?.message ?? String(error),
    name: error?.name ?? null,
    pageId: call?.pageId ?? null,
    requestId: call?.requestId ?? null,
    source: error?.source ?? null,
  };
}

export default toEntry;
