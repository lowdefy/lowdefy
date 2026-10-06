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

// Every page a --charters file names is a page in the head build. Checked
// before the scope is selected, so the refusal names the charter.
function checkCharterPages({ charters, headBuild }) {
  charters.forEach((charter, index) => {
    (charter.pages ?? []).forEach((pageId) => {
      if (!(pageId in headBuild.pages)) {
        throw new Error(
          `Charter ${index + 1} ("${
            charter.goal
          }") names page "${pageId}", which is not a page in the head build.`
        );
      }
    });
  });
}

export default checkCharterPages;
