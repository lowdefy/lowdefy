import home from './home';
import page from './page';

function routes(fastify, options, done) {
  fastify.get('/', home);
  fastify.get('/:pageId', page);
  done();
}

export default routes;
