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

// endpoints.json: { endpointId, type, link } for every endpoint, sorted by id. It is what a JIT
// page build checks its CallAPI actions and Dynamic blocks against (validateCallApiRefs,
// validateDynamicBlockRefs), so the dev server reads it rather than every endpoint artifact. An
// endpoint the dev manager rebuilds alone keeps its id, type and link (buildEndpointsJit falls
// back to a config build otherwise), so only a config build rewrites it.
async function writeEndpointList({ components, context }) {
  const endpoints = (components.api ?? [])
    .map((endpoint) => ({
      endpointId: endpoint.endpointId,
      type: endpoint.type,
      link: endpoint.link === true,
    }))
    .sort((a, b) => (a.endpointId < b.endpointId ? -1 : 1));
  await context.writeBuildArtifact('endpoints.json', JSON.stringify(endpoints));
}

export default writeEndpointList;
