function home(request, reply) {
  // TODO: We need to call /lowdefy/root here to get homepageId given user auth
  reply.redirect('/home');
}

export default home;
