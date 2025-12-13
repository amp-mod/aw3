import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
  const apiRoute = url.pathname.replace(/^\/catvet\/?/, '');

  const apiUrl = `https://api.scratch.mit.edu/${apiRoute}`;

  try {
    const res = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'curl/8.17.0 aw3 catvet https://codeberg.org/ampmod/aw3'
      }
    });

    const contentType = res.headers.get('content-type') ?? 'application/octet-stream';

    return new Response(res.body, {
      headers: {
        'Content-Type': contentType,
        Server: 'aw3 catvet'
      }
    });
  } catch (err) {
    console.error(err);
    return new Response('', { status: 500 });
  }
};
