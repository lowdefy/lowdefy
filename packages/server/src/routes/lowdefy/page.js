import { getPage } from '@lowdefy/api';

async function page(request, reply) {
  const { pageId } = request.params;
  const page = await getPage(request.lowdefyContext, { pageId });
  reply.send(page);
}

export default page;
