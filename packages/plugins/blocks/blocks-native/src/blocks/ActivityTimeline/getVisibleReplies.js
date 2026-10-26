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
 * The replies a thread shows: the newest `limit` of those loaded, or all loaded once expanded;
 * how many it does not show (`hidden`, for "Show N earlier replies"), and how many of those are
 * not loaded (`unloaded`, which the page loads through onLoadReplies). `reply_count` is the
 * thread's count from the server, which can be more than the replies loaded.
 *
 * @param {Object} params
 * @param {{ replies?: Object[], reply_count?: number }} params.thread
 * @param {boolean} params.expanded
 * @param {number} params.limit
 * @returns {{ replies: Object[], hidden: number, unloaded: number }}
 */
function getVisibleReplies({ thread, expanded, limit }) {
  const loaded = (thread.replies ?? []).filter((reply) => reply?.deleted !== true);
  const total = Math.max(thread.reply_count ?? 0, loaded.length);
  const replies = expanded ? loaded : loaded.slice(Math.max(0, loaded.length - limit));
  return {
    replies,
    hidden: total - replies.length,
    unloaded: total - loaded.length,
  };
}

export default getVisibleReplies;
