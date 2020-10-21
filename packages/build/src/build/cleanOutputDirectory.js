import cleanDirectory from '../utils/files/cleanDirectory';

async function cleanOutputDirectory({ context }) {
  return cleanDirectory(context.outputBaseDir);
}

export default cleanOutputDirectory;
