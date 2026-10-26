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

// A call that never reached the server: the platform's fetch rejected (no connection, a DNS or TLS
// failure, Lowdefy Dev's offline injection), which every shell call marks at the one fetch it goes
// through (withNetworkErrors). A TypeError thrown after a response arrived is a fault, not this.
function isNetworkError(error) {
  return error?.isNetworkError === true;
}

export default isNetworkError;
