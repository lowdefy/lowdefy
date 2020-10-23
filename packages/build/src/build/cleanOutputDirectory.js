import cleanDirectory from '../utils/files/cleanDirectory';

async function cleanOutputDirectory({ context }) {
  return cleanDirectory(context.outputDirectory);
}

export default cleanOutputDirectory;
