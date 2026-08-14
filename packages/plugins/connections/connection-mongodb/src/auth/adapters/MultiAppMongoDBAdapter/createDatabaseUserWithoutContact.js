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

import { v4 as uuid } from 'uuid';

import transformContactToAdapterUser from './transformContactToAdapterUser.js';

async function createDatabaseUserWithoutContact({
  adapterUserData,
  appName,
  collectionNames,
  inviteRequired,
  mongoClient,
}) {
  if (inviteRequired) {
    throw new Error('Access denied.');
  }
  const { email, emailVerified: email_verified, image = null } = adapterUserData;
  const contact = {
    _id: uuid(),
    email,
    email_verified,
    global_attributes: {},
    image,
    lowercase_email: email.toLowerCase(),
    profile: {},
    disabled: false,
    apps: {
      [appName]: {
        app_attributes: {},
        disabled: false,
        is_user: true,
        roles: [],
        sign_up: new Date(),
      },
    },
  };
  contact.created = { timestamp: new Date(), user: { id: contact._id } };
  contact.updated = { timestamp: new Date(), user: { id: contact._id } };

  await mongoClient.db().collection(collectionNames.contacts).insertOne(contact);
  return transformContactToAdapterUser({ appName, contact });
}

export default createDatabaseUserWithoutContact;
