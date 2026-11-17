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

import formatAccessCommand from './formatAccessCommand.js';

// The one command that writes an app's first tests/access.yaml, and its roles data set when the
// app has none, from a fresh production build.
function formatFirstFileCommand({ configDirectory }) {
  const build = formatAccessCommand({ configDirectory, args: 'build --no-client-build' });
  const update = formatAccessCommand({ configDirectory, args: 'test --update-access' });
  return `${build} && ${update}`;
}

export default formatFirstFileCommand;
