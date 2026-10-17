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

import { fixtureTest, postJourney } from './fixtureClient.mjs';

// Object storage under a data set: an AwsS3Bucket connection declares
// meta.dataSet 'external', so a page-load request on it is sunk (recorded and
// answered null, never sent) instead of being refused as undeclared.

fixtureTest(
  'a data-set journey whose page signs a file on an AwsS3Bucket connection passes and sinks the request',
  async () => {
    const result = await postJourney({
      pageId: 'storage',
      data: 'storage',
      user: 'member',
      steps: [{ expect: { visible: 'storage_title' } }],
    });
    expect(result.failure).toBeUndefined();
    expect(result.passed).toBe(true);
    expect(result.exercised.requests).toEqual([
      { pageId: 'storage', requestId: 'sign_file', calls: 1, write: false },
    ]);
    expect(result.sunk).toEqual([
      {
        connectionId: 'storage_bucket',
        connectionType: 'AwsS3Bucket',
        requestId: 'sign_file',
        requestType: 'AwsS3PresignedGetObject',
        pageId: 'storage',
        endpointId: null,
        request: { key: 'reports/fixture.txt' },
      },
    ]);
  }
);
