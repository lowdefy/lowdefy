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

import { createAnthropic } from '@ai-sdk/anthropic';

// Shared by the connection's create and the request resolvers, which receive
// evaluated connection properties (not a provider instance) from the request
// interface layer and must construct the provider themselves.
function createProvider({ connection }) {
  const { apiKey, baseURL } = connection ?? {};
  return createAnthropic({ apiKey, baseURL });
}

export default createProvider;
