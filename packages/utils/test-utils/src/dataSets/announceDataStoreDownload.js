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

import { DryMongoBinary } from 'mongodb-memory-server-core/lib/util/DryMongoBinary.js';

// The first data store on a machine downloads its mongod binary, which takes a while and says
// nothing on its own. `purpose` is what the store is for, as the line reads.
async function announceDataStoreDownload({ logger, purpose }) {
  const options = await DryMongoBinary.generateOptions();
  const binary = await DryMongoBinary.locateBinary(options);
  if (binary === undefined) {
    logger.info(`Downloading MongoDB ${options.version} for ${purpose} (once).`);
    return true;
  }
  return false;
}

export default announceDataStoreDownload;
