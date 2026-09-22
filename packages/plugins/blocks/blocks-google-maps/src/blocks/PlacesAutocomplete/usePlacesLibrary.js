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

import { useEffect, useState } from 'react';
import { type } from '@lowdefy/helpers';

// GoogleMapsScript only renders its children once the Google Maps JavaScript API
// has loaded, so a descendant that was configured with `libraries: [places]` finds
// the places library on the first render. When the block is rendered outside a
// GoogleMapsScript, or the script omitted the places library, there is nothing to
// read and the block falls back to a plain text input.
function getLoadedPlacesLibrary() {
  return window.google?.maps?.places ?? null;
}

function usePlacesLibrary() {
  const [placesLibrary, setPlacesLibrary] = useState(getLoadedPlacesLibrary);

  useEffect(() => {
    if (!type.isNone(placesLibrary)) return;
    if (!type.isFunction(window.google?.maps?.importLibrary)) return;
    let cancelled = false;
    window.google.maps
      .importLibrary('places')
      .then((library) => {
        if (cancelled) return;
        setPlacesLibrary(library);
      })
      // The Places API is billed separately and can be disabled on the key, in
      // which case the block keeps working as a plain text input.
      .catch(() => null);
    return () => {
      cancelled = true;
    };
  }, [placesLibrary]);

  return placesLibrary;
}

export default usePlacesLibrary;
