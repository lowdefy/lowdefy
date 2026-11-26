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

// A step's own failure (toStepFailure), naming the websocket subscriptions the actor's page held
// open when it failed. Headless, a subscription gets no messages (createInertWebSocketClient), so
// a step that waits on a live message fails here and passes in a browser; without the note that
// failure reads as the page being wrong. A journey with no page, or a page holding none, keeps
// its failure as it is.
function noteSilentSubscriptions({ actor, failure }) {
  if (actor.page === null) {
    return failure;
  }
  const open = [...actor.page.context._internal.WebSockets.active];
  if (open.length === 0) {
    return failure;
  }
  const names = open.map((websocketId) => `"${websocketId}"`).join(', ');
  const held =
    open.length === 1
      ? `The page holds websocket subscription ${names}, which gets no messages headless`
      : `The page holds websocket subscriptions ${names}, which get no messages headless`;
  return {
    ...failure,
    message: `${failure.message} ${held}: a step that waits on a live message passes only in a browser.`,
  };
}

export default noteSilentSubscriptions;
