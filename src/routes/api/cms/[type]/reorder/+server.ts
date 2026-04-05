import { getContentTypeBySlug, reorderContentItems } from '$lib/services/cms';
import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ platform, locals, params, request }) => {
  if (!locals.user) {
    throw error(401, 'Unauthorized');
  }
  if (!locals.user.isOwner && !locals.user.isAdmin) {
    throw error(403, 'Forbidden');
  }

  const db = platform?.env?.DB;
  if (!db) {
    throw error(500, 'Database not available');
  }

  const contentType = await getContentTypeBySlug(db, params.type);
  if (!contentType) {
    throw error(404, `Content type "${params.type}" not found`);
  }

  const body = await request.json();
  const itemIds = Array.isArray(body?.itemIds)
    ? body.itemIds.filter((value: unknown): value is string => typeof value === 'string' && value.length > 0)
    : [];

  if (itemIds.length === 0) {
    throw error(400, 'itemIds must contain at least one content item id');
  }

  const reordered = await reorderContentItems(db, contentType.id, itemIds);
  if (!reordered) {
    throw error(400, 'Item order could not be updated');
  }

  return json({ success: true });
};