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

import findHookUser from './findHookUser.js';

// The bindable auth hook points and what each hands the hook routine as
// _payload - the contract between the hook mechanism and the hook author.
// Build validation guarantees every configured point is in this catalog.
//
// Database points receive BetterAuth's databaseHooks record; session and
// account writes carry only a userId, so the subject user is read through
// BetterAuth's internal adapter. user.update deviates from the catalog by
// what BetterAuth provides: the before hook receives only the changed fields
// (no way to identify the subject), the after hook only the updated record.
//
// Synthetic points are backed by BetterAuth config callbacks, not database
// hooks. "invitation.send" is accepted at build but its backing callback
// ships with the organization plugin in a later phase.
const authHookPoints = {
  'user.create.before': {
    kind: 'database',
    model: 'user',
    operation: 'create',
    timing: 'before',
    buildPayload: (data) => ({ user: data }),
  },
  'user.create.after': {
    kind: 'database',
    model: 'user',
    operation: 'create',
    timing: 'after',
    buildPayload: (data) => ({ user: data }),
  },
  'user.update.before': {
    kind: 'database',
    model: 'user',
    operation: 'update',
    timing: 'before',
    buildPayload: (data) => ({ user: null, changes: data }),
  },
  'user.update.after': {
    kind: 'database',
    model: 'user',
    operation: 'update',
    timing: 'after',
    buildPayload: (data) => ({ user: data, changes: null }),
  },
  'session.create.before': {
    kind: 'database',
    model: 'session',
    operation: 'create',
    timing: 'before',
    buildPayload: async (data, ctx) => ({
      session: data,
      user: await findHookUser({ ctx, userId: data.userId }),
    }),
  },
  'session.create.after': {
    kind: 'database',
    model: 'session',
    operation: 'create',
    timing: 'after',
    buildPayload: async (data, ctx) => ({
      session: data,
      user: await findHookUser({ ctx, userId: data.userId }),
    }),
  },
  'session.delete.after': {
    kind: 'database',
    model: 'session',
    operation: 'delete',
    timing: 'after',
    buildPayload: async (data, ctx) => ({
      session: data,
      user: await findHookUser({ ctx, userId: data.userId }),
    }),
  },
  'account.create.before': {
    kind: 'database',
    model: 'account',
    operation: 'create',
    timing: 'before',
    buildPayload: async (data, ctx) => ({
      account: data,
      user: await findHookUser({ ctx, userId: data.userId }),
    }),
  },
  'account.create.after': {
    kind: 'database',
    model: 'account',
    operation: 'create',
    timing: 'after',
    buildPayload: async (data, ctx) => ({
      account: data,
      user: await findHookUser({ ctx, userId: data.userId }),
    }),
  },
  'verification.create.before': {
    kind: 'database',
    model: 'verification',
    operation: 'create',
    timing: 'before',
    buildPayload: (data) => ({ verification: data }),
  },
  'verification.create.after': {
    kind: 'database',
    model: 'verification',
    operation: 'create',
    timing: 'after',
    buildPayload: (data) => ({ verification: data }),
  },
  'email.verified': {
    kind: 'synthetic',
    timing: 'after',
    buildPayload: (user) => ({ user }),
  },
  'invitation.send': {
    kind: 'synthetic',
    timing: 'after',
    unwired: true,
  },
};

export default authHookPoints;
