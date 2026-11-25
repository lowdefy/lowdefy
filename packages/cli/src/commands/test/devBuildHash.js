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

import { type } from '@lowdefy/helpers';

// The key a dev server run takes headless-run.json's records on (findBrowserOnlyRecord): the
// server's build (`buildHash`, hashBuild as the run starts or ends) and the app's config source as
// the run started (`sourceHash`, hashConfigSources), so an edit to any config file runs a
// remembered journey headless again, whether or not the server rebuilt its page. Null when either
// cannot be read.
function devBuildHash({ buildHash, sourceHash }) {
  if (type.isNone(buildHash) || type.isNone(sourceHash)) {
    return null;
  }
  return `${buildHash}+${sourceHash}`;
}

export default devBuildHash;
