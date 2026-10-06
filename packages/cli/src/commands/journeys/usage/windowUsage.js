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

// A flow's use inside a usage window: its sessions and failures summed over
// the months of `months` that fall in `windowMonths`, the final days those
// months hold, and the rate, sessions per day (0 with no days in the window).
// Persons and orgs are left out: the same person shows up in several months.
function windowUsage({ months, windowMonths }) {
  const usage = { sessions: 0, failures: 0, days: 0 };
  (months ?? []).forEach((entry) => {
    if (!windowMonths.includes(entry.month)) return;
    usage.sessions += entry.sessions;
    usage.failures += entry.failures;
    usage.days += entry.days;
  });
  return { ...usage, rate: usage.days === 0 ? 0 : usage.sessions / usage.days };
}

export default windowUsage;
