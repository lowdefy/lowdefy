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

async function transformContactToAdapterUser({ appName, contact }) {
  const {
    _id: id,
    email,
    email_verified: emailVerified = null,
    global_attributes = {},
    image = null,
    profile = {},
  } = contact;

  const { app_attributes, roles } = contact.apps[appName];

  return {
    id,
    app_attributes,
    email,
    emailVerified,
    image,
    profile,
    roles,
    global_attributes,
  };
}

export default transformContactToAdapterUser;
