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

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// ps lstart, read with LC_ALL=C and TZ=UTC: "Fri Oct  2 20:55:31 2026". Read as UTC
// explicitly, so the result never depends on the time zone this process runs in.
const LSTART = /^\w{3}\s+(\w{3})\s+(\d{1,2})\s+(\d{1,2}):(\d{2}):(\d{2})\s+(\d{4})$/;

// The start time as epoch milliseconds, or null when the text is not an lstart.
function parsePsStartTime(text) {
  const match = LSTART.exec(text.trim());
  if (match === null) {
    return null;
  }
  const month = MONTHS.indexOf(match[1]);
  if (month === -1) {
    return null;
  }
  return Date.UTC(
    Number(match[6]),
    month,
    Number(match[2]),
    Number(match[3]),
    Number(match[4]),
    Number(match[5])
  );
}

export default parsePsStartTime;
