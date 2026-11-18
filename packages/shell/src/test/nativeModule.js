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

// A stand-in for the native modules a test has no native side for (expo-haptics, expo-location,
// expo-maps, react-native-nfc-manager, ...): each export the shell reads from them is a function
// that resolves to undefined, so the shell's device features can be built in tests. Tests that
// exercise a feature install their own fakes in the device registry. An ES module names its
// exports, so a name the shell starts to read from one of these modules is added here.
function stub() {
  return Promise.resolve(undefined);
}

export {
  stub as Accuracy,
  stub as activateKeepAwakeAsync,
  stub as AppleMaps,
  stub as clearSharedPayloads,
  stub as Contact,
  stub as ContactField,
  stub as createEventInCalendarAsync,
  stub as createWidget,
  stub as deactivateKeepAwake,
  stub as Directory,
  stub as File,
  stub as GeofencingEventType,
  stub as getCalendars,
  stub as getCurrentPositionAsync,
  stub as getDocumentAsync,
  stub as getResolvedSharedPayloadsAsync,
  stub as GoogleMaps,
  stub as hasStartedGeofencingAsync,
  stub as hasStartedLocationUpdatesAsync,
  stub as impactAsync,
  stub as ImpactFeedbackStyle,
  stub as launchCameraAsync,
  stub as launchImageLibraryAsync,
  stub as listEvents,
  stub as Ndef,
  stub as NfcError,
  stub as NfcTech,
  stub as notificationAsync,
  stub as NotificationFeedbackType,
  stub as Paths,
  stub as requestBackgroundPermissionsAsync,
  stub as requestCalendarPermissions,
  stub as requestForegroundPermissionsAsync,
  stub as ResponseType,
  stub as restoreSystemBrightnessAsync,
  stub as selectionAsync,
  stub as setBrightnessAsync,
  stub as shareAsync,
  stub as speak,
  stub as startGeofencingAsync,
  stub as startLocationUpdatesAsync,
  stub as stop,
  stub as stopGeofencingAsync,
  stub as stopLocationUpdatesAsync,
};

export default stub;
