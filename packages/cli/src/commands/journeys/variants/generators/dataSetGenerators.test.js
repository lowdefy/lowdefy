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

import empty from './empty.js';
import roleGranted from './roleGranted.js';
import roleRefused from './roleRefused.js';
import tenant from './tenant.js';
import volume from './volume.js';

const dataSet = {
  name: 'tickets',
  fixtures: {
    tickets: [
      { _id: 't1', organizationId: 'org_a', title: 'Printer jam', status: 'open' },
      { _id: 't2', organizationId: 'org_a', title: 'Broken chair', status: 'open' },
      { _id: 't3', organizationId: 'org_b', title: 'Leaking tap', status: 'open' },
    ],
    companies: [{ _id: 'c1', organizationId: 'org_c', name: 'Gamma' }],
  },
  users: {
    member: { id: 'u_1', roles: ['member'], organizationId: 'org_a' },
    admin: { id: 'u_2', roles: ['admin'], organizationId: 'org_a' },
    stranger: { id: 'u_8', roles: ['admin'], organizationId: 'org_b' },
    outsider: { id: 'u_9', roles: ['member'], organizationId: 'org_b' },
  },
};

const journey = {
  name: 'member closes a ticket',
  pageId: 'tickets',
  data: 'tickets',
  user: 'member',
  steps: [
    { click: 'filter_open' },
    { expect: { visible: { blockId: 'grid', containing: 'Printer jam' } } },
    { click: { blockId: 'grid', containing: 'Broken chair' } },
    { expect: { text: { blockId: 'status', contains: 'open' } } },
    { goto: 'ticket' },
    { expect: { text: { blockId: 'title', contains: 'Broken chair' } } },
  ],
};

const pageConfigs = [{ blockId: 'tickets', auth: { public: false, roles: ['member', 'admin'] } }];

test('roleGranted writes one variant per other role set a data set user holds', () => {
  expect(roleGranted({ journey, dataSet, roleMatrix: null, pageConfigs })).toEqual({
    variants: [
      {
        kind: 'role',
        detail: 'granted to admin [admin]',
        overrides: { user: 'admin' },
        steps: journey.steps,
        comments: {
          0: 'Passes? Keep admin as a persona of "member closes a ticket", not a copy: set its user to [member, admin] and delete this file.',
        },
      },
    ],
    skipped: [],
  });
});

test('roleGranted skips the role sets of every user a journey lists, and adds to its list', () => {
  const listed = { ...journey, user: ['member', 'stranger'] };
  expect(roleGranted({ journey: listed, dataSet, roleMatrix: null, pageConfigs })).toEqual({
    skipped: "no role set other than the journey user's among the data set users",
  });
  const generated = roleGranted({
    journey: listed,
    dataSet,
    roleMatrix: [['member'], ['admin'], ['admin', 'member']],
    pageConfigs,
  });
  expect(generated.variants).toEqual([]);
  expect(generated.skipped).toEqual(['add a user with roles [admin, member] to the data set']);
  const memberOnly = roleGranted({
    journey: { ...journey, user: ['member'] },
    dataSet,
    roleMatrix: null,
    pageConfigs,
  });
  expect(memberOnly.variants.map(({ overrides, comments }) => ({ overrides, comments }))).toEqual([
    {
      overrides: { user: 'admin' },
      comments: {
        0: 'Passes? Keep admin as a persona of "member closes a ticket", not a copy: set its user to [member, admin] and delete this file.',
      },
    },
  ]);
});

test('roleGranted writes no list comment for a journey with an inline user', () => {
  const inline = { ...journey, user: { roles: ['member'] } };
  const generated = roleGranted({ journey: inline, dataSet, roleMatrix: null, pageConfigs });
  expect(generated.variants.map(({ detail }) => detail)).toEqual(['granted to admin [admin]']);
  expect(generated.variants[0]).not.toHaveProperty('comments');
});

test('roleGranted reads the page role matrix and lists a role set no user has', () => {
  const generated = roleGranted({
    journey,
    dataSet,
    roleMatrix: [['member'], ['admin', 'member'], ['admin']],
    pageConfigs: [{}],
  });
  expect(generated.variants.map(({ detail }) => detail)).toEqual(['granted to admin [admin]']);
  expect(generated.skipped).toEqual(['add a user with roles [admin, member] to the data set']);
});

test('roleGranted and roleRefused are skipped without a data set', () => {
  const plain = { ...journey, data: undefined, user: { roles: ['member'] } };
  expect(roleGranted({ journey: plain, dataSet: null, roleMatrix: null, pageConfigs })).toEqual({
    skipped: 'the journey declares no data: set',
  });
  expect(roleRefused({ journey: plain, dataSet: null, pageConfigs })).toEqual({
    skipped: 'the journey declares no data: set',
  });
});

test('roleRefused writes the /404 redirect before the first targeted block is hidden', () => {
  const pageConfigsMemberOnly = [{ auth: { public: false, roles: ['member'] } }];
  expect(roleRefused({ journey, dataSet, pageConfigs: pageConfigsMemberOnly })).toEqual([
    {
      kind: 'role',
      detail: 'refused to admin',
      overrides: { user: 'admin' },
      steps: [{ expect: { url: { contains: '/404' } } }, { expect: { hidden: 'filter_open' } }],
    },
  ]);
});

test('roleRefused is skipped without auth.roles or when every user holds a page role', () => {
  expect(roleRefused({ journey, dataSet, pageConfigs: [{ auth: { public: false } }] })).toEqual({
    skipped: 'page "tickets" has no auth.roles',
  });
  expect(roleRefused({ journey, dataSet, pageConfigs })).toEqual({
    skipped:
      'every data set user holds one of the page roles [member, admin]: add one who holds none',
  });
});

test('tenant waits for the outsider row, then hides each fixture value used on that page', () => {
  expect(tenant({ journey, dataSet })).toEqual([
    {
      kind: 'tenant',
      detail: 'as outsider of org_b',
      overrides: { user: 'outsider' },
      steps: [
        { click: 'filter_open' },
        { expect: { visible: { blockId: 'grid', containing: 'Leaking tap' } } },
        { expect: { hidden: { blockId: 'grid', containing: 'Printer jam' } } },
        { expect: { hidden: { blockId: 'grid', containing: 'Broken chair' } } },
      ],
    },
  ]);
});

test('tenant is skipped without an outsider fixture in the connection the values come from', () => {
  const noOutsiderRows = {
    ...dataSet,
    fixtures: { ...dataSet.fixtures, tickets: dataSet.fixtures.tickets.slice(0, 2) },
  };
  expect(tenant({ journey, dataSet: noOutsiderRows })).toEqual({
    skipped: 'add a tickets fixture for org_b so the tenant variant can prove the list loaded',
  });
});

test('tenant is skipped when all users share one organization or no fixture value is used', () => {
  const oneOrg = {
    ...dataSet,
    users: { member: dataSet.users.member, admin: dataSet.users.admin },
  };
  expect(tenant({ journey, dataSet: oneOrg })).toEqual({
    skipped: 'the data set has no user in another organization',
  });
  expect(
    tenant({ journey: { ...journey, steps: [{ expect: { visible: 'grid' } }] }, dataSet })
  ).toEqual({ skipped: 'no step selects or asserts a fixture value' });
});

const emptyDataSet = { name: 'empty-org', users: { member: { id: 'u_1', roles: ['member'] } } };

test('empty walks to the first data step and expects its block on the empty data set', () => {
  expect(empty({ journey, dataSet, emptyDataSet })).toEqual([
    {
      kind: 'empty',
      detail: 'on empty-org',
      overrides: { data: 'empty-org' },
      steps: [{ click: 'filter_open' }, { expect: { visible: 'grid' } }],
    },
  ]);
});

test('volume runs the same steps on the volume data set', () => {
  expect(volume({ journey, dataSet, volumeDataSet: { ...emptyDataSet, name: 'big' } })).toEqual([
    { kind: 'volume', detail: 'on big', overrides: { data: 'big' }, steps: journey.steps },
  ]);
});

test('empty and volume are skipped without their flag or when the set lacks the journey user', () => {
  expect(empty({ journey, dataSet, emptyDataSet: null })).toEqual({
    skipped: 'pass --empty-data <data set> to write it',
  });
  expect(volume({ journey, dataSet, volumeDataSet: null })).toEqual({
    skipped: 'pass --volume-data <data set> to write it',
  });
  const noMember = { name: 'big', users: { someone: {} } };
  expect(volume({ journey, dataSet, volumeDataSet: noMember })).toEqual({
    skipped: 'data set "big" has no user "member"',
  });
  expect(
    empty({ journey: { ...journey, user: { roles: ['member'] } }, dataSet, emptyDataSet })
  ).toEqual({ skipped: "the journey's user is not a data set user name" });
});
