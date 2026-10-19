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

// The names the App Store privacy label and Play's data safety form use for
// the data types in the shell's profile table (dataCollected).
const DATA_TYPES = {
  emailAddress: 'Email address',
  userId: 'User ID',
  photos: 'Photos or videos',
  preciseLocation: 'Precise location',
  coarseLocation: 'Approximate location',
  deviceId: 'Device ID',
};

const PURPOSES = {
  appFunctionality: 'app functionality',
  analytics: 'analytics',
};

function valueOrMissing(value, key) {
  return type.isString(value) ? value : `<${key} not set>`;
}

function describeData({ type: dataType, purpose }) {
  return `${DATA_TYPES[dataType] ?? dataType}: collected, linked to the user, for ${
    PURPOSES[purpose] ?? purpose
  }.`;
}

function storeRecords({ shell }) {
  return {
    id: 'store-records',
    title: 'Create the App Store Connect record and the Play Console app.',
    details: [
      `App Store Connect: a new app with bundle id ${valueOrMissing(
        shell.ios?.bundleId,
        'ios.bundleId'
      )}, in team ${valueOrMissing(shell.ios?.teamId, 'ios.teamId')}.`,
      `Play Console: a new app with package ${valueOrMissing(
        shell.android?.package,
        'android.package'
      )}.`,
      `Expo: the EAS project ${valueOrMissing(
        shell.eas?.projectId,
        'eas.projectId'
      )} owned by ${valueOrMissing(shell.eas?.owner, 'eas.owner')}.`,
    ],
  };
}

function firstBuild({ shell, env }) {
  const flags = `--shell ${shell.id} --env ${env}`;
  return {
    id: 'first-build',
    title: 'Run the first build and submission by hand.',
    details: [
      `lowdefy mobile build ${flags}, interactive and signed in to Apple and Google, so EAS creates and stores the signing certificate, provisioning profile, push key and Android keystore.`,
      `lowdefy mobile submit ${flags}. Google Play takes the first Android upload only by hand: upload the build to the internal testing track in Play Console.`,
      'Store an App Store Connect API key and a Google Play service-account key in EAS (eas credentials), which submit uses from then on.',
      'After that, CI needs only EXPO_TOKEN and runs lowdefy mobile release --non-interactive.',
    ],
  };
}

function privateDistribution({ shell }) {
  return {
    id: 'private-distribution',
    title: 'Make the app private to its organisation. Once per shell.',
    details: [
      `App Store Connect, Pricing and Availability: make ${valueOrMissing(
        shell.ios?.bundleId,
        'ios.bundleId'
      )} a Custom App and add the organisations that may install it.`,
      `Managed Google Play: make ${valueOrMissing(
        shell.android?.package,
        'android.package'
      )} a private app for the organisation.`,
    ],
  };
}

function androidSigningKey({ shell }) {
  const sha256 = shell.android?.sha256 ?? [];
  return {
    id: 'android-signing-key',
    title: 'Copy the Play app signing key into android.sha256 and deploy the server.',
    done: sha256.length > 0,
    details: [
      `After the first Android upload, copy the app signing key's SHA-256 from Play Console (Test and release, App integrity) into mobile.shells "${shell.id}" android.sha256, then deploy the server, so sign-in by sheet works on Android.`,
    ],
  };
}

// The profile's collected data with each shell plugin's joined in, each type
// and purpose once.
function getDataCollected({ profile, plugins }) {
  const all = [
    ...profile.dataCollected,
    ...plugins.flatMap(({ entry }) => entry.dataCollected ?? []),
  ];
  const seen = new Set();
  return all.filter(({ type: dataType, purpose }) => {
    const key = `${dataType} ${purpose}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function privacy({ profile, plugins }) {
  const pluginNote = plugins.length === 0 ? '' : ' and its shell plugins';
  const details = [
    `App Store privacy labels and Google Play's data safety form, for profile ${profile.name}${pluginNote}:`,
    ...getDataCollected({ profile, plugins }).map(describeData),
  ];
  if (profile.name === 'field-tracking') {
    details.push(
      "Background location: fill in Play Console's location permissions declaration, with a video of the feature, and explain the use in the App Review notes."
    );
  }
  return {
    id: 'privacy',
    title: "Answer the stores' privacy questions.",
    details,
  };
}

function listOrNone(values) {
  return values.length === 0 ? 'none' : values.join(', ');
}

function describePlugin({ name, version, entry }) {
  const permissions = listOrNone(entry.permissions ?? []);
  const privacyReasons = listOrNone(
    (entry.privacyReasons ?? []).map(
      ({ category, reasons }) => `${category} (${(reasons ?? []).join(', ')})`
    )
  );
  const data = listOrNone(
    (entry.dataCollected ?? []).map(
      ({ type: dataType, purpose }) =>
        `${DATA_TYPES[dataType] ?? dataType} for ${PURPOSES[purpose] ?? purpose}`
    )
  );
  return `${name}@${version}: permissions ${permissions}; privacy reasons ${privacyReasons}; data ${data}.`;
}

function shellPlugins({ plugins }) {
  return {
    id: 'shell-plugins',
    title: "Check what the shell's plugins declare.",
    details: [
      ...plugins.map(describePlugin),
      "An SDK on Apple's list of commonly used SDKs needs its own signed privacy manifest inside the SDK. Check that each plugin's SDK carries one.",
      'A plugin that adds background modes, Bluetooth or tracking needs its own App Review notes and Play Console declarations. Add them for each plugin that does.',
    ],
  };
}

function reviewAndPromote() {
  return {
    id: 'review-and-promote',
    title: 'For each native release, submit for review and promote.',
    details: [
      'App Store Connect: submit the TestFlight build for App Review.',
      'Play Console: promote the release from internal testing.',
      "Native releases happen only when the shell's runtime version changes. Over-the-air updates need neither.",
    ],
  };
}

// The steps the stores force a person to do for one shell, in order, filled in
// with its own values. Data, so lowdefy mobile checklist prints it and tests
// read it.
// plugins are the shell's resolved shell plugins, each { name, version, entry }
// with its "./shell" entry.
function createChecklist({ shell, profile, env, plugins = [] }) {
  const distribution = shell.distribution ?? 'private';
  const steps = [storeRecords({ shell }), firstBuild({ shell, env })];
  if (distribution === 'private') {
    steps.push(privateDistribution({ shell }));
  }
  steps.push(androidSigningKey({ shell }), privacy({ profile, plugins }));
  if (plugins.length > 0) {
    steps.push(shellPlugins({ plugins }));
  }
  if (distribution !== 'internal') {
    steps.push(reviewAndPromote());
  }
  return steps.map((step) => ({ done: false, ...step }));
}

export default createChecklist;
