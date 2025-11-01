// Server-side: create signed URLs or protected endpoints for purchased digital files.
// Client-side: call your API to get the signed URL and then trigger a download.

export async function fetchDownloadLink(productId: string) {
  const res = await fetch(`/api/download/${productId}`);
  if (!res.ok) throw new Error('Failed to get download link');
  return res.json();
}
