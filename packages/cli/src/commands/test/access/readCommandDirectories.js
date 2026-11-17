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

// The directories a printed command names: the app's config directory, and the server directory
// only when it was typed on the command line. A server directory from lowdefy.yaml's cli config
// applies to the printed command on its own, and the default needs no flag.
function readCommandDirectories({ context }) {
  const typed = (context.options.typedOptions ?? []).includes('serverDirectory');
  return {
    configDirectory: context.directories.config,
    serverDirectory: typed ? context.directories.server : undefined,
  };
}

export default readCommandDirectories;
