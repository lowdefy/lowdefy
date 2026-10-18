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

// The view's position and height in the ScrollView's content, and the height of the ScrollView's
// visible area.
function measureInScrollView({ scrollView, view }) {
  const measureElement = new Promise((resolve, reject) => {
    view.measureLayout(
      scrollView.getInnerViewRef(),
      (left, top, width, height) => resolve({ height, top }),
      () => reject(new Error('ScrollTo could not measure the block in the page.'))
    );
  });
  const measureViewport = new Promise((resolve) => {
    scrollView.getNativeScrollRef().measure((x, y, width, height) => resolve({ height }));
  });
  return Promise.all([measureElement, measureViewport]).then(([element, viewport]) => ({
    element,
    viewport,
  }));
}

export default measureInScrollView;
