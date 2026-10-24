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

import * as Location from 'expo-location';

/**
 * The location device feature (profile field): GeolocationCurrentPosition reads the phone's
 * position, asking for location while in use the first time. Answers as the web's geolocation
 * does: { coords, timestamp }, or the PERMISSION_DENIED shape when refused.
 */
function createLocationFeature() {
  return {
    async current({ enableHighAccuracy = false } = {}) {
      const { granted } = await Location.requestForegroundPermissionsAsync();
      if (!granted) {
        return { code: 1, error: 'PERMISSION_DENIED', message: 'Location permission was denied.' };
      }
      const position = await Location.getCurrentPositionAsync({
        accuracy: enableHighAccuracy ? Location.Accuracy.High : Location.Accuracy.Balanced,
      });
      return { coords: position.coords, timestamp: position.timestamp };
    },
  };
}

export default createLocationFeature;
