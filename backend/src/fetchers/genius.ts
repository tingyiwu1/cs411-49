import { Client } from "genius-lyrics";

export async function getSongLyrics(
  genius: Client,
  name: string,
  artists: string[]
) {
  try {
    const query = `${name} ${artists.join(", ")}`;
    const songs = await genius.songs.search(query);
    if (!songs || songs.length === 0) return "";
    const song = songs[0];
    return await song.lyrics();
  } catch (e) {
    return "";
  }
}
