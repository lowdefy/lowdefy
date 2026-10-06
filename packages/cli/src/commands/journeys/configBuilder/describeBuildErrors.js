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

const MAX_LISTED_ERRORS = 10;

// The first build errors from a config builder result, one per line, each
// with its config source when the build knows it.
function describeBuildErrors(errors) {
  return errors
    .slice(0, MAX_LISTED_ERRORS)
    .map((error) => `  ${error.source ? `${error.source}: ` : ''}${error.message}`)
    .join('\n');
}

export default describeBuildErrors;
