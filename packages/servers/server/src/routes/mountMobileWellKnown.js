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

import { createAppleAppSiteAssociation, createAssetLinks } from '@lowdefy/api';

// The universal link (iOS) and app link (Android) documents for the app's
// shells, from mobile.shells. Both are public, unauthenticated and constant per
// build, so they are built once and mount outside the api context, before the
// /.well-known/* catch-all. A document no shell needs is not mounted, so the
// catch-all answers 404 for it.
function mountMobileWellKnown({ app, basePath, mobileConfig }) {
  const appleAppSiteAssociation = createAppleAppSiteAssociation({ mobileConfig, basePath });
  if (appleAppSiteAssociation !== null) {
    app.get('/.well-known/apple-app-site-association', (c) => c.json(appleAppSiteAssociation));
  }
  const assetLinks = createAssetLinks({ mobileConfig });
  if (assetLinks !== null) {
    app.get('/.well-known/assetlinks.json', (c) => c.json(assetLinks));
  }
}

export default mountMobileWellKnown;
