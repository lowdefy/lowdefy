import { createContext } from '@lowdefy/api';
import page from './page';
import root from './root';

async function routes(fastify, { lowdefy }, done) {
  // This is done as an optimisation, the lowdefyContext object will be added in the preHandler hook
  fastify.decorateRequest('lowdefyContext', null);

  const { apiPath, configDirectory, development, getSecrets } = lowdefy;
  const contextFn = await createContext({ apiPath, configDirectory, development, getSecrets });

  fastify.addHook('preHandler', (request, reply, done) => {
    request.lowdefyContext = contextFn({
      headers: {},
      host: '',
      setHeader: () => {},
    });
    done();
  });

  fastify.get('/page/:pageId', page);
  fastify.get('/root', root);
  done();
}

export default routes;
