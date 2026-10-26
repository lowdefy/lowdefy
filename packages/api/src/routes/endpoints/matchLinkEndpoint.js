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

// Finds the link endpoint a GET path names. linkEndpoints is the build's linkEndpoints.json,
// longest id first, so a nested id ("a/b") wins over a shorter id it starts with ("a"). The
// segments after the id, joined with "/", are the path the routine receives; it may be empty.
// Only link endpoints are listed, so a GET never reaches any other endpoint.
function matchLinkEndpoint({ linkEndpoints, segments }) {
  const match = linkEndpoints.find((linkEndpoint) =>
    linkEndpoint.segments.every((segment, index) => segments[index] === segment)
  );
  if (match === undefined) {
    return null;
  }
  return {
    endpointId: match.endpointId,
    path: segments.slice(match.segments.length).join('/'),
  };
}

export default matchLinkEndpoint;
