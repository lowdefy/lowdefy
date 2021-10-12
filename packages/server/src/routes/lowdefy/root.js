import { getRoot } from '@lowdefy/api';

async function page(request, reply) {
  const root = await getRoot(request.lowdefyContext);
  reply.send(root);
}

export default page;
