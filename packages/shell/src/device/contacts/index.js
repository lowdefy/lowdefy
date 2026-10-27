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

import { Contact, ContactField } from 'expo-contacts';

const FIELDS = [
  ContactField.FULL_NAME,
  ContactField.GIVEN_NAME,
  ContactField.FAMILY_NAME,
  ContactField.COMPANY,
  ContactField.EMAILS,
  ContactField.PHONES,
];

async function toContact(contact) {
  const details = await contact.getDetails(FIELDS);
  return {
    id: contact.id,
    name: details.fullName ?? null,
    firstName: details.givenName ?? null,
    lastName: details.familyName ?? null,
    company: details.company ?? null,
    emails: (details.emails ?? []).map((entry) => entry.address),
    phoneNumbers: (details.phones ?? []).map((entry) => entry.number),
  };
}

/**
 * The contacts device feature (the contacts extension): PickContact opens the system contact
 * picker; AddContact opens the new-contact form filled in for the person to save. Returns
 * { saved } since the form does not say which contact it made.
 */
const contacts = {
  async pick() {
    const contact = await Contact.presentPicker();
    return contact === null ? null : toContact(contact);
  },
  async add({ company, emails = [], firstName, lastName, phoneNumbers = [] }) {
    const saved = await Contact.presentCreateForm({
      company,
      emails: emails.map((address) => ({ address, label: 'work' })),
      familyName: lastName,
      givenName: firstName,
      phones: phoneNumbers.map((number) => ({ number, label: 'mobile' })),
    });
    return saved ? { saved: true } : null;
  },
};

// The contacts extension's device features (profiles.js CONTACTS_ENTRY).
const features = { contacts };
const hosts = [];

export { features, hosts };
