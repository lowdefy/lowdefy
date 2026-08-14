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

import transformContactToAdapterUser from './transformContactToAdapterUser.js';

async function createDatabaseUserFromContact({
  adapterUserData,
  appName,
  collectionNames,
  contact,
  inviteRequired,
  mongoClient,
}) {
  const invite = contact.apps?.[appName]?.invite;
  if (inviteRequired && (!invite || !invite.open)) {
    throw new Error('Access denied.');
  }

  if (contact.disabled || contact.removed || contact.apps?.[appName]?.disabled) {
    throw new Error('Access denied.');
  }

  const { emailVerified: email_verified, image } = adapterUserData;

  const update = {
    email_verified,
    image,
    updated: { timestamp: new Date(), user: { id: contact._id } },
  };

  if (contact.apps?.[appName]) {
    update[`apps.${appName}.disabled`] = false;
    update[`apps.${appName}.is_user`] = true;
    update[`apps.${appName}.sign_up`] = new Date();

    if (invite) {
      update[`apps.${appName}.invite.open`] = false;
    }
  } else {
    update[`apps.${appName}`] = {
      app_attributes: {},
      disabled: false,
      is_user: true,
      roles: [],
      sign_up: new Date(),
    };
  }

  const updatedContact = await mongoClient
    .db()
    .collection(collectionNames.contacts)
    .findOneAndUpdate({ _id: contact._id }, { $set: update }, { returnDocument: 'after' });
  return transformContactToAdapterUser({ appName, contact: updatedContact });
}

export default createDatabaseUserFromContact;
