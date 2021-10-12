import path from 'path';
import fastifyStatic from 'fastify-static';

function publicFiles(fastify, { lowdefy }, done) {
  fastify.register(fastifyStatic, {
    root: path.resolve(lowdefy.directory),
  });

  done();
}

export default publicFiles;
