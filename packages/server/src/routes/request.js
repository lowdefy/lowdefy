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

import { request as requestFn } from '@lowdefy/api';

async function requestHandler(request, reply) {
  const { pageId, requestId } = request.params;
  const { payload } = request.body;
  const response = await requestFn(request.lowdefyContext, { pageId, payload, requestId });
  reply.send(response);
}

export default requestHandler;
