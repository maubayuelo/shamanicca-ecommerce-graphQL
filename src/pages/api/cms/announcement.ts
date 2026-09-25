import type { NextApiRequest, NextApiResponse } from 'next';
import client from '../../../lib/graphql/apolloClient';
import { GET_SITE_SETTINGS_ANNOUNCEMENT } from '../../../lib/graphql/queries';
import type { GetSiteSettingsAnnouncementData } from '../../../lib/graphql/types';
import { mapAnnouncement } from '../../../utils/announcement';

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');

  try {
    const { data } = await client.query<GetSiteSettingsAnnouncementData>({
      query: GET_SITE_SETTINGS_ANNOUNCEMENT,
      fetchPolicy: 'no-cache',
    });

    return res.status(200).json({ banner: mapAnnouncement(data.page) });
  } catch (err) {
    console.error(
      '[api/cms/announcement] GraphQL request failed:',
      err instanceof Error ? err.message : String(err),
    );
    return res.status(200).json({ banner: null });
  }
}
