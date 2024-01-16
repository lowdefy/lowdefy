/*
  Copyright 2020-2024 Lowdefy, Inc

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

import path from 'path';
import axios from 'axios';
import { readFile } from '@lowdefy/node-utils';

async function getTypes({ directories }) {
  return JSON.parse(await readFile(path.join(directories.build, 'types.json')));
}

function getSendTelemetry({
  appId,
  cliVersion,
  command,
  directories,
  license,
  lowdefyVersion,
  options,
}) {
  if (options.disableTelemetry) {
    return () => {};
  }
  async function sendTelemetry({ data = {}, sendTypes = false } = {}) {
    let types;
    if (sendTypes) {
      types = await getTypes({ directories });
    }
    try {
      await axios.request({
        method: 'post',
        url: 'https://api.lowdefy.net/v4/telemetry/cli',
        headers: {
          'User-Agent': `Lowdefy CLI v${cliVersion}`,
        },
        data: {
          ...data,
          app_id: appId,
          cli_version: cliVersion,
          command,
          license_id: license?.id,
          lowdefy_version: lowdefyVersion,
          types,
        },
      });
    } catch (error) {
      // pass
    }
  }
  return sendTelemetry;
}

export default getSendTelemetry;
