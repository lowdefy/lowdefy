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

const MAX_LISTED = 10;

function listFiles(files) {
  const listed = files.slice(0, MAX_LISTED).join(', ');
  return files.length > MAX_LISTED ? `${listed} and ${files.length - MAX_LISTED} more` : listed;
}

// What to say when no page is a target: the diff sees only the compared
// artifacts, so say what else changed (uncompared build files, plugin code)
// and how to list every page anyway.
function describeEmptyScope({ scope, pluginDirectories = [] }) {
  const parts = ['no change in the compared artifacts'];
  if (scope.uncompared.length > 0) {
    parts.push(`changed but not compared: ${listFiles(scope.uncompared)}`);
  }
  pluginDirectories.forEach((directory) => {
    parts.push(`plugin code changed under ${directory}`);
  });
  parts.push('run without --base to list every page.');
  return parts.join('; ');
}

export default describeEmptyScope;
