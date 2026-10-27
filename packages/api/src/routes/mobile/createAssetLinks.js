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

// The Digital Asset Links statement that lets the app's Android shells open
// its links (app links), built from mobile.shells in mobile/config.json. A
// shell needs a package name and at least one signing certificate fingerprint
// to be named here. Android filters link paths in the shell's manifest.
//
// Returns null when no shell takes Android links.
function createAssetLinks({ mobileConfig }) {
  const statements = (mobileConfig.shells ?? [])
    .filter((shell) => type.isString(shell.android?.package) && shell.android.sha256?.length > 0)
    .map((shell) => ({
      relation: ['delegate_permission/common.handle_all_urls'],
      target: {
        namespace: 'android_app',
        package_name: shell.android.package,
        sha256_cert_fingerprints: shell.android.sha256,
      },
    }));
  if (statements.length === 0) {
    return null;
  }
  return statements;
}

export default createAssetLinks;
