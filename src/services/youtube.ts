import { google } from 'googleapis';
import type { Video } from '@/lib/types';

const youtube = google.youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_API_KEY,
});

export async function searchVideos(query: string): Promise<Video[]> {
  const response = await youtube.search.list({
    part: ['snippet'],
    q: query,
    type: ['video'],
    maxResults: 9,
  });

  if (!response.data.items) {
    return [];
  }

  const videos: Video[] = response.data.items.map((item) => ({
    id: item.id!.videoId!,
    url: `https://www.youtube.com/watch?v=${item.id!.videoId!}`,
    title: item.snippet!.title!,
    thumbnail: item.snippet!.thumbnails!.high!.url!,
    description: item.snippet!.description!,
  }));

  return videos;
}
