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

/**
 * Summary error thrown after build errors have already been logged.
 *
 * Used to stop the build process with a summary message like
 * "Build failed with 5 error(s). See above for details."
 * The real errors are logged individually before this is thrown.
 *
 * Stack traces are suppressed by the CLI logger via isLowdefyError marker.
 *
 * @example
 * context.handleError(configError); // log the real error
 * throw new BuildError('Build failed with 1 error(s). See above for details.');
 */
class BuildError extends Error {
  constructor(message) {
    super(message);
    this.name = 'BuildError';
    this.isLowdefyError = true;
  }
}

export default BuildError;
