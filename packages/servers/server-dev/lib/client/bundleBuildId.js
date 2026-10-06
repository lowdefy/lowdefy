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

// The dev server stamps no x-lowdefy-build on auth responses and refuses no call from another
// build: a config edit reaches open tabs through /api/reload. So the auth fetch never reloads in
// dev and needs no build id. The client does not import build/appMeta.json, which every rebuild
// rewrites with a new id, so Vite would hot-update the auth client on every config edit. The auth
// templates in lib/client/auth are byte-identical with the production server's, so each server
// supplies the build id from outside them.
const bundleBuildId = null;

export default bundleBuildId;
