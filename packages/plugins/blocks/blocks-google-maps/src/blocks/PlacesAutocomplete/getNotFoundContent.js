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

// Returning null keeps the dropdown closed. Without the places library there is
// nothing to search, and before the first keystroke there is nothing to report.
function getNotFoundContent({ input, isLoading, placesReady, properties }) {
  if (!placesReady) return null;
  if (isLoading) return properties.loadingPlaceholder ?? 'Loading...';
  if (input === '') return null;
  return properties.notFoundContent ?? 'No results found';
}

export default getNotFoundContent;
