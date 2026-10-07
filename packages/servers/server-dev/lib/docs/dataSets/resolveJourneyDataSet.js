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

import { type } from '@lowdefy/helpers';

import readDataSet from './readDataSet.js';

function isUserName(user) {
  return type.isString(user) && user !== 'none';
}

function describeDeclaredUsers({ users }) {
  const names = Object.keys(users);
  if (names.length === 0) {
    return 'It declares no users.';
  }
  return `Declared: ${names.join(', ')}.`;
}

// Everything a journey's data set decides before a browser opens: the data set itself (read and
// checked against the built connections), and who the journey acts as. A string `user` other than
// "none" names a data set user. Returns { dataSet, user } (both undefined for a journey with no data
// set) or { error }.
//
// `user: none` while a dev mock user is active is refused: no caller cookie is injected, so the mock
// user would stand in for the journey instead of it running signed out.
//
// Two refusals keep a data-set journey off the app's real auth database:
// - `user: none` while auth is configured: a signed-out actor signs in through the auth engine,
//   which is bound to the real auth database while its requests read the data set;
// - any data-set journey while a dev mock user is active: the mock user wins over the injected
//   caller, so the journey would silently act as someone outside the data set.
//
// `subject` names the run in the refusals: "journey" for a journey, "call" for the other dev tools
// that act as someone (resolveToolCaller), which take the same user and data.
async function resolveJourneyDataSet({
  data,
  user,
  subject = 'journey',
  configDirectory,
  buildDirectory,
  authConfigured,
  mockUserActive,
}) {
  if (type.isNone(data)) {
    if (user === 'none' && mockUserActive) {
      return {
        error: `The ${subject} has user "none", which cannot run while a dev mock user is active (auth.dev.mockUser or LOWDEFY_DEV_USER): with no caller of its own, every request would act as the mock user, not signed out. Remove the mock user to run signed out, or give the ${subject} a user.`,
      };
    }
    if (isUserName(user)) {
      return {
        error: `The ${subject}'s user ${JSON.stringify(
          user
        )} names a data set user, but the ${subject} has no "data". Add data: <data set name>, or give user as an object.`,
      };
    }
    return { user };
  }
  if (mockUserActive) {
    return {
      error: `The ${subject} on data set ${JSON.stringify(
        data
      )} cannot run while a dev mock user is active (auth.dev.mockUser or LOWDEFY_DEV_USER): every request would act as the mock user, who is not in the data set. Remove the mock user to run on data sets.`,
    };
  }
  if (user === 'none' && authConfigured) {
    return {
      error: `The ${subject} on data set ${JSON.stringify(
        data
      )} has user "none", which is refused while auth is configured: signing in through the app would write to the app's real auth database. Name a data set user instead; runs that sign in stay off data sets.`,
    };
  }
  let dataSet;
  try {
    dataSet = await readDataSet({ configDirectory, buildDirectory, name: data });
  } catch (error) {
    return { error: error.message };
  }
  if (!isUserName(user)) {
    return { dataSet, user };
  }
  if (!Object.prototype.hasOwnProperty.call(dataSet.users, user)) {
    return {
      error: `Data set "${data}" declares no user ${JSON.stringify(user)}. ${describeDeclaredUsers(
        dataSet
      )}`,
    };
  }
  return { dataSet, user: dataSet.users[user] };
}

export default resolveJourneyDataSet;
