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

import { HTTPException } from 'hono/http-exception';

// A request whose verified data cookie names a session that has closed outlived its journey. The
// verified token proves it came from a journey, so it is answered 410 and never falls back to the
// app's own database. Thrown as an HTTPException, which the error handler sends as it is.
function createDataSessionEndedError({ id }) {
  const message = `Data session ${id} has ended; this request outlived its journey.`;
  return new HTTPException(410, {
    message,
    res: new Response(JSON.stringify({ name: 'DataSessionEnded', message }), {
      status: 410,
      headers: { 'content-type': 'application/json' },
    }),
  });
}

export default createDataSessionEndedError;
