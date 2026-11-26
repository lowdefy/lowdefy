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

import fs from 'fs';
import path from 'path';

// Each endpoint build writes a jitMaps file with the key and ref entries of the
// artifacts it wrote, and adds them to the kept config build's maps. An
// endpoint rebuilt again replaces its artifact, so its earlier entries name no
// live node. A file whose endpoints were all rebuilt since is removed, with
// its entries in the kept maps, so an agent editing one endpoint all day keeps
// one copy of its entries rather than one per edit.
function pruneEndpointMaps({ endpointRegistry, rebuiltIds, keyMap, refMap, directories }) {
  for (const [name, mapsFile] of endpointRegistry.mapsFiles) {
    for (const endpointId of rebuiltIds) {
      mapsFile.endpointIds.delete(endpointId);
    }
    if (mapsFile.endpointIds.size > 0) continue;
    fs.rmSync(path.join(directories.build, 'jitMaps', name), { force: true });
    for (const id of mapsFile.ids) {
      delete keyMap[id];
      delete refMap[id];
    }
    endpointRegistry.mapsFiles.delete(name);
  }
}

export default pruneEndpointMaps;
