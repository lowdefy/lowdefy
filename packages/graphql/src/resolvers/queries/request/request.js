function request(_, { input }, { getController }) {
  return getController('request').callRequest(input);
}

export default request;
