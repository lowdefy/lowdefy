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

function getServerSession({ req }) {
  const cookieHeader = req?.headers?.cookie ?? '';
  const match = cookieHeader.match(/lowdefy_e2e_user=([^;]+)/);
  if (!match) {
    return undefined;
  }

  try {
    const decoded = Buffer.from(decodeURIComponent(match[1]), 'base64').toString();
    const user = JSON.parse(decoded);
    return { user };
  } catch {
    return undefined;
  }
}

export default getServerSession;
