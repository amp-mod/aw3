import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
  const assetId = url.pathname.replace(/^\/warehouse\/asset\//, '');

  const cdnUrl = `https://cdn.assets.scratch.mit.edu/internalapi/asset/${assetId}/get/`;

  try {
    const res = await fetch(cdnUrl, {
      headers: {
        'User-Agent': 'curl/8.17.0 aw3 warehouse https://codeberg.org/ampmod/aw3'
      }
    });

    if (!res.ok || !res.body) {
      return new Response('', { status: 404 });
    }

    const contentType = res.headers.get('content-type') ?? 'application/octet-stream';

    return new Response(res.body, {
      headers: {
        'Content-Type': contentType,
        Server: 'aw3 warehouse'
      }
    });
  } catch (err) {
    console.error(err);
    return new Response('', { status: 500 });
  }
};
