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

/**
 * Marks a rejection of the platform's fetch as a network failure (isNetworkError): the request never
 * reached the server, so the offline queue keeps it and the screens say there is no connection.
 * Marked where the platform answers, so a programming fault later in the send path (a TypeError
 * reading the response) is never taken for "offline". A call the caller aborted is not marked.
 *
 * @param {Function} fetch The platform's fetch (React Native's, expo/fetch, or Lowdefy Dev's).
 */
function withNetworkErrors(fetch) {
  return async function networkErrorFetch(url, init) {
    try {
      return await fetch(url, init);
    } catch (error) {
      if (init?.signal?.aborted !== true && error instanceof Error) {
        error.isNetworkError = true;
      }
      throw error;
    }
  };
}

export default withNetworkErrors;
