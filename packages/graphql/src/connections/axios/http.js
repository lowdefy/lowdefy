import axios from 'axios';
import { mergeObjects } from '@lowdefy/helpers';

async function axiosHTTP({ request, connection, context }) {
  try {
    const config = mergeObjects([connection, request]);
    const res = await axios(config);
    const { status, statusText, headers, method, path, data } = res;
    return { status, statusText, headers, method, path, data };
  } catch (error) {
    if (error.isAxiosError) {
      throw new context.RequestError(
        `Status: ${error.response.status}, ${error.response.statusText}; Data: ${JSON.stringify(
          error.response.data
        )}`
      );
    }
    throw error;
  }
}

export default axiosHTTP;
