import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ platform, params }) => {
  const bucket = platform?.env?.MEDIA_BUCKET;
  if (!bucket) {
    throw error(404, 'Media bucket not configured');
  }

  const object = await bucket.get(params.key);
  if (!object || !object.body) {
    throw error(404, 'Image not found');
  }

  const headers = new Headers();
  if (object.httpMetadata?.contentType) {
    headers.set('content-type', object.httpMetadata.contentType);
  }
  if (object.httpMetadata?.cacheControl) {
    headers.set('cache-control', object.httpMetadata.cacheControl);
  }
  if (object.httpMetadata?.contentDisposition) {
    headers.set('content-disposition', object.httpMetadata.contentDisposition);
  }
  if (object.httpEtag) {
    headers.set('etag', object.httpEtag);
  }

  return new Response(await object.arrayBuffer(), {
    status: 200,
    headers
  });
};