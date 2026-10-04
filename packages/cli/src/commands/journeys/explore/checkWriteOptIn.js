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

// --live-data and --allow-external let walks write outside a data set, which
// needs the app's cli.agentTools.allowWriteRequests opt-in, as every agent
// tool that writes does. Checked before anything builds; the walk routes
// enforce it again. Returns an error message, or undefined.
function checkWriteOptIn({ cliConfig, liveData, allowExternal }) {
  if (!liveData && allowExternal.length === 0) return undefined;
  if (cliConfig?.agentTools?.allowWriteRequests === true) return undefined;
  const flag = liveData ? '--live-data' : '--allow-external';
  return `${flag} lets walks write outside a data set, which needs cli.agentTools.allowWriteRequests: true in lowdefy.yaml.`;
}

export default checkWriteOptIn;
