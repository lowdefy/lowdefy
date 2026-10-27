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
 * Whether a thread keeps its place: always, unless its first comment is deleted and nothing of
 * the thread is left (no reply loaded that is not deleted, and no reply count).
 *
 * @param {{ deleted?: boolean, replies?: Object[], reply_count?: number }} thread
 * @returns {boolean}
 */
function isThreadShown(thread) {
  if (thread.deleted !== true) {
    return true;
  }
  const liveReplies = (thread.replies ?? []).filter((reply) => reply?.deleted !== true);
  return liveReplies.length > 0 || (thread.reply_count ?? 0) > 0;
}

export default isThreadShown;
