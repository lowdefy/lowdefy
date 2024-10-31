import runRoutine from '../runRoutine.js';

function testContext() {
  return {};
}

async function runTest({ routine }) {
  const context = testContext();
  const res = await runRoutine(context, { routine });
  return res;
}

export default runTest;
