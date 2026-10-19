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

// The build artifacts config mutants reach, by path relative to the build
// directory. A request artifact sits under its page's folder, so a page
// artifact is any other JSON file under pages/.
const REQUEST_ARTIFACT = /^pages\/.+\/requests\/[^/]+\.json$/;
const PAGE_ARTIFACT = /^pages\/(?!.+\/requests\/[^/]+\.json$).+\.json$/;
const ENDPOINT_ARTIFACT = /^api\/.+\.json$/;
const EVENTS_ARTIFACT = /^events\.json$/;

export { REQUEST_ARTIFACT, PAGE_ARTIFACT, ENDPOINT_ARTIFACT, EVENTS_ARTIFACT };
