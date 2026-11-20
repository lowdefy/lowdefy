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

// The header the dev server's endpoints route answers a webhook with, naming the call's request
// id, only for a call on a journey's data session. A webhook routine that failed answers 500 with
// a fixed body and no request id (api's createWebhookAnswer), so a browser run's webhook step reads
// the message of a forced failure by this id instead (runJourneyWebhook). The production server
// never sends it, and the body a webhook's sender receives is unchanged.
const JOURNEY_REQUEST_ID_HEADER = 'x-lowdefy-journey-request-id';

export default JOURNEY_REQUEST_ID_HEADER;
