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

// The params schemas of the native actions, which the build and the docs read (./schemas). The
// blocks' schemas are built from their metas (./metas).
export { default as AddCalendarEvent } from './actions/AddCalendarEvent/schema.js';
export { default as AddContact } from './actions/AddContact/schema.js';
export { default as CancelNotification } from './actions/CancelNotification/schema.js';
export { default as DiscardQueuedRequest } from './actions/DiscardQueuedRequest/schema.js';
export { default as GetCalendarEvents } from './actions/GetCalendarEvents/schema.js';
export { default as GetRequestQueue } from './actions/GetRequestQueue/schema.js';
export { default as Haptic } from './actions/Haptic/schema.js';
export { default as KeepAwake } from './actions/KeepAwake/schema.js';
export { default as PickContact } from './actions/PickContact/schema.js';
export { default as PickFile } from './actions/PickFile/schema.js';
export { default as PickImage } from './actions/PickImage/schema.js';
export { default as ReadNfc } from './actions/ReadNfc/schema.js';
export { default as RefreshWidgets } from './actions/RefreshWidgets/schema.js';
export { default as RequestNotificationPermission } from './actions/RequestNotificationPermission/schema.js';
export { default as RetryRequestQueue } from './actions/RetryRequestQueue/schema.js';
export { default as ScanCode } from './actions/ScanCode/schema.js';
export { default as ScanDocument } from './actions/ScanDocument/schema.js';
export { default as ScheduleNotification } from './actions/ScheduleNotification/schema.js';
export { default as SetBadgeCount } from './actions/SetBadgeCount/schema.js';
export { default as SetBrightness } from './actions/SetBrightness/schema.js';
export { default as Share } from './actions/Share/schema.js';
export { default as Speak } from './actions/Speak/schema.js';
export { default as StartGeofencing } from './actions/StartGeofencing/schema.js';
export { default as StartLocationTracking } from './actions/StartLocationTracking/schema.js';
export { default as StartRecording } from './actions/StartRecording/schema.js';
export { default as StopGeofencing } from './actions/StopGeofencing/schema.js';
export { default as StopLocationTracking } from './actions/StopLocationTracking/schema.js';
export { default as StopRecording } from './actions/StopRecording/schema.js';
export { default as StopSpeaking } from './actions/StopSpeaking/schema.js';
export { default as TakePhoto } from './actions/TakePhoto/schema.js';
export { default as WriteNfc } from './actions/WriteNfc/schema.js';
