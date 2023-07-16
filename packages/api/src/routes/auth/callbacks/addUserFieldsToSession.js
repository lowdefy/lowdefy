/*
  Copyright 2020-2023 Lowdefy, Inc

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

function addUserFieldsToSession({ session, token, authConfig, user }) {
  if (token) {
    Object.keys(authConfig.userFields).forEach((fieldName) => {
      session.user[fieldName] = token[fieldName];
    });
  }
  if (user) {
    Object.keys(authConfig.userFields).forEach((fieldName) => {
      session.user[fieldName] = user[fieldName];
    });
  }
}

export default addUserFieldsToSession;
