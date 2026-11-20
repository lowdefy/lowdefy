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

import { isReserved } from '@lowdefy/helpers';

// The secrets an endpoint test runs with: a stand-in for every secret the build names, valued
// test-secret-<NAME>, with the values given to openTestApp({ secrets }) over them. A real key
// per name, not a catch-all: the _secret operator copies the secrets object before it reads
// from it, so anything short of an own property reads as missing. Stand-ins are there because
// a connection's schema is checked before its request is sunk or redirected: an AwsS3Bucket
// with no accessKeyId fails validation and never gets as far as the sink.
function createTestSecrets({ names, secrets }) {
  const standIns = Object.fromEntries(
    names.filter((name) => !isReserved(name)).map((name) => [name, `test-secret-${name}`])
  );
  return Object.freeze({ ...standIns, ...secrets });
}

export default createTestSecrets;
