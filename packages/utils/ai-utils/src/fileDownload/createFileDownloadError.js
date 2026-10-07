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

// A refused or failed agent file download. `code` names the reason; `status` is the HTTP status
// the link answered with, when there was one. The message names the host, never the link: a file
// link is usually signed, and this error reaches the server log.
function createFileDownloadError({ code, message, status, cause }) {
  const error = new Error(message, { cause });
  error.code = code;
  if (status !== undefined) {
    error.status = status;
  }
  return error;
}

export default createFileDownloadError;
