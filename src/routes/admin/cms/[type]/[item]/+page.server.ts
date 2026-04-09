import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch, params }) => {
  const typeSlug = params.type;
  const itemId = params.item;
  const isCreateMode = itemId === 'new';

  const typesRes = await fetch('/api/cms/types');
  if (!typesRes.ok) {
    throw error(500, 'Failed to load content types');
  }

  const typesData = await typesRes.json();
  const contentType = typesData.types?.find((type: any) => type.slug === typeSlug);
  if (!contentType) {
    throw error(404, `Content type "${typeSlug}" not found`);
  }

  let item = null;
  if (!isCreateMode) {
    const itemRes = await fetch(`/api/cms/${typeSlug}/${itemId}`);
    if (!itemRes.ok) {
      throw error(itemRes.status === 404 ? 404 : 500, 'Failed to load content item');
    }

    const itemPayload = await itemRes.json();
    item = itemPayload.item ?? null;
  }

  let tags: any[] = [];
  if (contentType.settings?.hasTags) {
    try {
      const tagsRes = await fetch(`/api/cms/${typeSlug}/tags`);
      if (tagsRes.ok) {
        const tagsData = await tagsRes.json();
        tags = tagsData.tags || [];
      }
    } catch {
      // Tags are optional for the editor route.
    }
  }

  return {
    contentType,
    item,
    tags,
    isCreateMode
  };
};