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

import appMeta from '../../build/appMeta.json';

// The build this client bundle was made from. The auth templates in lib/client/auth are kept
// byte-identical with server-dev's, so each server supplies the build id from outside them.
const bundleBuildId = appMeta.buildId;

export default bundleBuildId;
