/*
  Copyright 2020-2024 Lowdefy, Inc

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

async function waitForRequest(page, requestId) {
  // Wait for request to complete (loading === false)
  await page.waitForFunction(
    (reqId) => {
      const lowdefy = window.lowdefy;
      if (!lowdefy) return false;
      const pageId = lowdefy.pageId;
      const requests = lowdefy.contexts?.[`page:${pageId}`]?.requests?.[reqId];
      return requests && requests.length > 0 && requests[0].loading === false;
    },
    requestId,
    { timeout: 30000 }
  );
}

async function getRequestResponse(page, requestId) {
  return page.evaluate((reqId) => {
    const lowdefy = window.lowdefy;
    const pageId = lowdefy?.pageId;
    const requests = lowdefy?.contexts?.[`page:${pageId}`]?.requests?.[reqId];
    return requests?.[0]?.response;
  }, requestId);
}

export { waitForRequest, getRequestResponse };
