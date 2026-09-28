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

import React from 'react';
import { type } from '@lowdefy/helpers';

import getPerson from '../getPerson.js';
import isEmptyValue from '../isEmptyValue.js';
import AvatarMark from './AvatarMark.js';
import EmptyCell from './EmptyCell.js';

// One person shows with their name; several show as an overlapping group of
// `max` avatars (default 3) with a +N count, and all names on hover.
function PeopleCell({ value, column }) {
  const { cell } = column;
  const people = (type.isArray(value) ? value : [value])
    .filter((item) => !isEmptyValue(item))
    .map((item) => getPerson({ item, cell }));
  if (people.length === 0) return <EmptyCell />;
  if (people.length === 1) {
    const [person] = people;
    return (
      <span className="lf-table-person">
        <AvatarMark name={person.name} src={person.src} seed={person.id} shape={cell.shape} />
        <span className="lf-table-person-name">{person.name}</span>
      </span>
    );
  }
  const max = type.isInt(cell.max) ? cell.max : 3;
  const shown = people.slice(0, max);
  const hidden = people.length - shown.length;
  const names = people.map((person) => person.name).join(', ');
  return (
    <span className="lf-table-people" title={names} role="img" aria-label={names}>
      {shown.map((person, index) => (
        <AvatarMark
          key={`${index}-${person.id ?? person.name}`}
          name={person.name}
          src={person.src}
          seed={person.id}
          shape={cell.shape}
        />
      ))}
      {hidden > 0 && <span className="lf-table-avatar lf-table-people-more">+{hidden}</span>}
    </span>
  );
}

export default PeopleCell;
