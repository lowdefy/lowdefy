/*
  Copyright 2020-2021 Lowdefy, Inc

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

import createReadConfigFile from './readConfigFile';
import verifyAuthorizationHeader from './verifyAuthorizationHeader';

async function createContext({
  // apiPath,
  configDirectory,
  development,
  getSecrets,
}) {
  const readConfigFile = createReadConfigFile({ configDirectory });
  const [config, secrets] = await Promise.all([readConfigFile('config.json'), getSecrets()]);
  function contextFn({ headers, host, setHeader }) {
    const context = {
      authorize: () => true,
      config,
      development,
      headers,
      host,
      httpPrefix: development ? 'http' : 'https',
      readConfigFile,
      secrets,
      setHeader,
    };
    const { user, roles } = verifyAuthorizationHeader(context);
    context.user = user;
    context.roles = roles;
    return context;
  }
  return contextFn;
}

export default createContext;
