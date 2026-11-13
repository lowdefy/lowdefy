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

// Opens the camera stream the scanner reads. Browsers only expose mediaDevices on secure
// (https or localhost) pages, so its absence is reported as a SecurityError like a blocked page.
async function openCamera({ aspectRatio, deviceId, facingMode, mediaDevices, torch }) {
  if (!mediaDevices) {
    const error = new Error('The camera can only be used on a secure (https) page.');
    error.name = 'SecurityError';
    throw error;
  }
  const video = deviceId ? { deviceId: { exact: deviceId } } : { facingMode };
  video.aspectRatio = { ideal: aspectRatio };
  const stream = await mediaDevices.getUserMedia({ audio: false, video });
  if (torch) {
    const [track] = stream.getVideoTracks();
    // Torch is a camera capability, not a browser one: most phones' back cameras have it,
    // iPhones in Safari and front cameras do not, and asking without it rejects.
    if (track.getCapabilities?.().torch) {
      try {
        await track.applyConstraints({ advanced: [{ torch: true }] });
      } catch (error) {
        // The scanner only learns of the stream once this returns, so release it here.
        stream.getTracks().forEach((cameraTrack) => cameraTrack.stop());
        throw error;
      }
    }
  }
  return stream;
}

export default openCamera;
