import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

function sanitizeFilename(filename: string): string {
  return filename
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'image';
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000;

  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }

  return btoa(binary);
}

export const POST: RequestHandler = async ({ platform, locals, request, url }) => {
  if (!locals.user) {
    throw error(401, 'Unauthorized');
  }

  if (!locals.user.isOwner && !locals.user.isAdmin) {
    throw error(403, 'Forbidden');
  }

  const formData = await request.formData();
  const file = formData.get('file');

  if (!(file instanceof File)) {
    throw error(400, 'An image file is required');
  }

  if (!file.type.startsWith('image/')) {
    throw error(400, 'Only image uploads are supported');
  }

  if (file.size === 0) {
    throw error(400, 'Uploaded image is empty');
  }

  if (file.size > MAX_IMAGE_BYTES) {
    throw error(413, 'Images must be 10MB or smaller');
  }

  const buffer = await file.arrayBuffer();
  const bucket = platform?.env?.MEDIA_BUCKET;

  if (bucket) {
    const key = `wysiwyg/${Date.now()}-${crypto.randomUUID()}-${sanitizeFilename(file.name)}`;
    await bucket.put(key, buffer, {
      httpMetadata: {
        contentType: file.type,
        cacheControl: 'public, max-age=31536000, immutable',
        contentDisposition: `inline; filename="${sanitizeFilename(file.name)}"`
      }
    });

    return json(
      {
        key,
        url: `${url.origin}/api/cms/uploads/${key}`,
        storage: 'r2'
      },
      { status: 201 }
    );
  }

  return json(
    {
      url: `data:${file.type};base64,${arrayBufferToBase64(buffer)}`,
      storage: 'inline'
    },
    { status: 201 }
  );
};