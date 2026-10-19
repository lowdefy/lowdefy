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

// Header names that mean the same column, each group one concept, as normalizeHeader gives them.
// A CSV header and a column (by key or title) in the same group match: "Website" goes to a
// "Company domain" column, "Employer" to "Company", "Role" to "Job title".
const CSV_HEADER_SYNONYMS = [
  ['name', 'full name', 'person', 'person name', 'contact', 'contact name'],
  ['company', 'company name', 'employer', 'organisation', 'organization', 'org', 'account'],
  [
    'domain',
    'company domain',
    'website',
    'company website',
    'web',
    'site',
    'url',
    'homepage',
    'web address',
  ],
  ['job title', 'title', 'role', 'position', 'job', 'job role'],
  ['email', 'e mail', 'email address', 'e mail address', 'mail', 'work email'],
  ['phone', 'phone number', 'telephone', 'tel', 'mobile', 'cell'],
  ['first name', 'firstname', 'given name', 'forename'],
  ['last name', 'lastname', 'surname', 'family name'],
  ['linkedin', 'linkedin url', 'linkedin profile'],
  ['industry', 'sector', 'vertical'],
  ['country', 'nation'],
  ['city', 'town'],
];

export default CSV_HEADER_SYNONYMS;
