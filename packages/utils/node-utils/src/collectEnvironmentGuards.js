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

// Guards pin an environment's secrets and environment variables to a pattern kept in code: the
// value must match the regular expression, so changing a guarded value (the prod database URI,
// say) takes a change to the deployment's variables AND a reviewed change to the app config — a
// second factor for deploy-time configuration. Checked at build, before anything deploys.
//
//   guards:
//     secrets: { MONGODB_URI: 'acme-prod\.a1b2c\.mongodb\.net' }   # LOWDEFY_SECRET_<NAME>
//     env: { BETTER_AUTH_URL: '^https://app\.acme\.com$' }
//
// Values are never echoed: a failure names the variable, not what it holds.

function collectEnvironmentGuards({ guards }) {
  const checks = [];
  Object.entries(guards?.secrets ?? {}).forEach(([name, pattern]) => {
    if (name.startsWith('~')) return;
    checks.push({ label: `secret "${name}"`, variable: `LOWDEFY_SECRET_${name}`, pattern });
  });
  Object.entries(guards?.env ?? {}).forEach(([name, pattern]) => {
    if (name.startsWith('~')) return;
    checks.push({ label: `environment variable "${name}"`, variable: name, pattern });
  });
  return checks;
}

export default collectEnvironmentGuards;
