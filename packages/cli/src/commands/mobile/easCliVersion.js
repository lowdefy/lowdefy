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

// Every lowdefy mobile command runs this eas-cli through npx, never a global
// install, so a build behaves the same on every machine and in CI. eas.json
// pins the same version as cli.version.
const EAS_CLI_VERSION = '24.12.1';

export default EAS_CLI_VERSION;
