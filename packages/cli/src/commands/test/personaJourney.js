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

// One persona run of a journey whose `user` is a list of data set user
// names: the same journey as that one user, named `<name> [<user>]`. Results,
// --filter, recordings and exercised.json all read the run by this name.
function personaJourney({ journey, user }) {
  return { ...journey, name: `${journey.name} [${user}]`, user };
}

export default personaJourney;
