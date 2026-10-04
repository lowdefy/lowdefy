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

const DATA_SET_CONNECTION_TYPE = 'MongoDBCollection';

// The head build's connections a walk would write to for real without a data
// set: the MongoDBCollection connections, which a data set redirects.
function listLiveDataConnections({ headBuild }) {
  return Object.entries(headBuild.connections)
    .filter(([, connection]) => connection.type === DATA_SET_CONNECTION_TYPE)
    .map(([connectionId]) => connectionId)
    .sort();
}

export default listLiveDataConnections;
