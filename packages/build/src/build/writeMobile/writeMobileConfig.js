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

import { serializer } from '@lowdefy/helpers';

async function writeMobileConfig({ components, context }) {
  const mobile = components.mobile ?? {};
  const config = {
    appId: mobile.appId ?? null,
    capacitor: mobile.capacitor ?? {},
    homePageId: mobile.config?.homePageId ?? null,
    name: mobile.name ?? components.name ?? null,
    serverUrl: mobile.serverUrl ?? null,
  };
  // skipMarkers: consumers (CLI capacitor config, mobile vite build, /api/root)
  // read this artifact as plain JSON — build markers must not leak into it.
  await context.writeBuildArtifact(
    'mobile/config.json',
    serializer.serializeToString(config, { skipMarkers: true })
  );
}

export default writeMobileConfig;
