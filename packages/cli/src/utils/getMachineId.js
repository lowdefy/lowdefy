/*
  Copyright 2020 Lowdefy, Inc

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

import keytar from 'keytar';
import { v4 as uuid } from 'uuid';

async function getMachineId() {
  try {
    let machineId = await keytar.getPassword('com.lowdefy.cli', 'machineId');
    if (!machineId) {
      machineId = uuid();
      await keytar.setPassword('com.lowdefy.cli', 'machineId', machineId);
    }
    return machineId;
  } catch (error) {
    return;
  }
}

export default getMachineId;
