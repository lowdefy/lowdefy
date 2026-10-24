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

// The native-only actions: device features the web has no action for. Each reaches the phone
// through the device registry (src/device/getDeviceFeature.js).
export { default as AddCalendarEvent } from './actions/AddCalendarEvent/AddCalendarEvent.js';
export { default as AddContact } from './actions/AddContact/AddContact.js';
export { default as CancelNotification } from './actions/CancelNotification/CancelNotification.js';
export { default as DiscardQueuedRequest } from './actions/DiscardQueuedRequest/DiscardQueuedRequest.js';
export { default as GetCalendarEvents } from './actions/GetCalendarEvents/GetCalendarEvents.js';
export { default as GetRequestQueue } from './actions/GetRequestQueue/GetRequestQueue.js';
export { default as Haptic } from './actions/Haptic/Haptic.js';
export { default as KeepAwake } from './actions/KeepAwake/KeepAwake.js';
export { default as PickContact } from './actions/PickContact/PickContact.js';
export { default as PickFile } from './actions/PickFile/PickFile.js';
export { default as PickImage } from './actions/PickImage/PickImage.js';
export { default as ReadNfc } from './actions/ReadNfc/ReadNfc.js';
export { default as RefreshWidgets } from './actions/RefreshWidgets/RefreshWidgets.js';
export { default as RequestNotificationPermission } from './actions/RequestNotificationPermission/RequestNotificationPermission.js';
export { default as RetryRequestQueue } from './actions/RetryRequestQueue/RetryRequestQueue.js';
export { default as ScanCode } from './actions/ScanCode/ScanCode.js';
export { default as ScanDocument } from './actions/ScanDocument/ScanDocument.js';
export { default as ScheduleNotification } from './actions/ScheduleNotification/ScheduleNotification.js';
export { default as SetBadgeCount } from './actions/SetBadgeCount/SetBadgeCount.js';
export { default as SetBrightness } from './actions/SetBrightness/SetBrightness.js';
export { default as Share } from './actions/Share/Share.js';
export { default as Speak } from './actions/Speak/Speak.js';
export { default as StartGeofencing } from './actions/StartGeofencing/StartGeofencing.js';
export { default as StartLocationTracking } from './actions/StartLocationTracking/StartLocationTracking.js';
export { default as StartRecording } from './actions/StartRecording/StartRecording.js';
export { default as StopGeofencing } from './actions/StopGeofencing/StopGeofencing.js';
export { default as StopLocationTracking } from './actions/StopLocationTracking/StopLocationTracking.js';
export { default as StopRecording } from './actions/StopRecording/StopRecording.js';
export { default as StopSpeaking } from './actions/StopSpeaking/StopSpeaking.js';
export { default as TakePhoto } from './actions/TakePhoto/TakePhoto.js';
export { default as WriteNfc } from './actions/WriteNfc/WriteNfc.js';
