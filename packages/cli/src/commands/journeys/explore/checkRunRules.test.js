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

import checkLiveDataRule from './checkLiveDataRule.js';
import checkWriteOptIn from './checkWriteOptIn.js';
import listLiveDataConnections from './listLiveDataConnections.js';

test('no data set on an app with MongoDBCollection connections is refused unless --live-data names the connections', () => {
  const liveConnections = listLiveDataConnections({
    headBuild: {
      connections: {
        tickets: { type: 'MongoDBCollection' },
        mailer: { type: 'SendGridMail' },
        accounts: { type: 'MongoDBCollection' },
      },
    },
  });
  expect(liveConnections).toEqual(['accounts', 'tickets']);
  expect(checkLiveDataRule({ dataName: null, liveConnections, liveData: false }).error).toMatch(
    /Name a data set \(tests\/data\/<name>\.yaml\)/
  );
  expect(checkLiveDataRule({ dataName: null, liveConnections, liveData: true })).toEqual({
    warning: '--live-data: walks write to accounts, tickets.',
  });
  expect(checkLiveDataRule({ dataName: 'staging', liveConnections, liveData: false })).toEqual({});
  expect(checkLiveDataRule({ dataName: null, liveConnections: [], liveData: false })).toEqual({});
});

test('--live-data and --allow-external need cli.agentTools.allowWriteRequests', () => {
  expect(checkWriteOptIn({ cliConfig: {}, liveData: true, allowExternal: [] })).toMatch(
    /^--live-data lets walks write outside a data set, which needs cli\.agentTools\.allowWriteRequests: true/
  );
  expect(checkWriteOptIn({ cliConfig: {}, liveData: false, allowExternal: ['mailer'] })).toMatch(
    /^--allow-external/
  );
  expect(
    checkWriteOptIn({
      cliConfig: { agentTools: { allowWriteRequests: true } },
      liveData: true,
      allowExternal: ['mailer'],
    })
  ).toBeUndefined();
  expect(checkWriteOptIn({ cliConfig: {}, liveData: false, allowExternal: [] })).toBeUndefined();
});
