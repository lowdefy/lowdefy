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

import type from './type.js';

const FIELDS = ['session', 'roles', 'memberships'];

// Reads an x-lowdefy-caller header (see callerStamp) into
// { caller, session, roles, memberships }. A field the header does not carry is
// null; an anonymous caller is { caller: '' } with every field null. No header
// is null: the response was not answered by a route that resolved a caller (it
// failed before, or came from a proxy), so it claims no caller.
function parseCallerStamp(header) {
  if (type.isNone(header)) {
    return null;
  }
  const [caller, ...fields] = header.split(';').map((part) => part.trim());
  const stamp = { caller, session: null, roles: null, memberships: null };
  fields.forEach((field) => {
    const separator = field.indexOf('=');
    const name = field.slice(0, separator);
    if (separator > 0 && FIELDS.includes(name)) {
      stamp[name] = field.slice(separator + 1);
    }
  });
  return stamp;
}

export default parseCallerStamp;
