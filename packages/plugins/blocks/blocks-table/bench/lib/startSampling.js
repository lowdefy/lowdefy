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

// In-page rAF frame sampler plus long-task observer; read back with stopSampling.
async function startSampling(page) {
  await page.evaluate(() => {
    const sampler = { frames: [], longTasks: [], running: true, last: 0 };
    window.__sampler = sampler;
    function tick(time) {
      if (!sampler.running) return;
      sampler.frames.push(time - sampler.last);
      sampler.last = time;
      requestAnimationFrame(tick);
    }
    requestAnimationFrame((time) => {
      sampler.last = time;
      requestAnimationFrame(tick);
    });
    sampler.observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => sampler.longTasks.push(entry.duration));
    });
    sampler.observer.observe({ type: 'longtask' });
  });
}

export default startSampling;
