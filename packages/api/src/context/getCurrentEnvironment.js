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

// The environment this deployment is, resolved by the build from LOWDEFY_ENVIRONMENT into
// config.environment and config.environments. Null when no current environment is set or when it
// is not declared, so callers fall back to their own defaults.
function getCurrentEnvironment({ config }) {
  const name = config?.environment;
  const settings = config?.environments?.[name];
  if (settings === undefined) return null;
  return { ...settings, name };
}

export default getCurrentEnvironment;
