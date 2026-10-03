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

// Written only by a build run with `environmentGuards: 'all'` (the `lowdefy data pull` build), so
// the pull can check a secret against every environment's pins. Every other build drops the other
// environments' guards and writes no such file.
async function writeEnvironmentGuards({ components, context }) {
  if (context.environmentGuards !== 'all') return;
  await context.writeBuildArtifact(
    'environmentGuards.json',
    JSON.stringify(components.environmentGuards, null, 2)
  );
}

export default writeEnvironmentGuards;
