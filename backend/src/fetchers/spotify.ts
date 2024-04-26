import { SpotifyApi, Track } from "@spotify/web-api-ts-sdk";
import * as data from "../../../sample_data.json";

export async function processPlaylists(spotifyApi: SpotifyApi) {
  try {
    // const playlists = await spotifyApi.currentUser.playlists.playlists();
    const playlists = data.playlists;
    // const playlistItems = await Promise.all(
    //   playlists.items.map(async (playlist) => {
    //     const tracks = await spotifyApi.playlists.getPlaylistItems(
    //       playlist.id,
    //       undefined,
    //       "items(track(name, artists, album(name)))"
    //     );
    //     return {
    //       name: playlist.name,
    //       description: playlist.description,
    //       tracks: tracks.items.map((item) => {
    //         return {
    //           name: item.track.name,
    //           artists: item.track.artists.map((artist) => artist.name),
    //           album: item.track.album.name,
    //         };
    //       }),
    //     };
    //   })
    // );
    return playlists.items.map((playlist, i) => {
      return {
        name: playlist.name,
        description: playlist.description,
        // tracks: playlistItems[i].tracks,
      };
    });
  } catch (e) {
    console.log(e);
    return null;
  }
}
export async function processTopArtists(spotifyApi: SpotifyApi) {
  try {
    // const topArtists = await spotifyApi.currentUser.topItems("artists");
    const topArtists = data.topArtists;
    return topArtists.items.map((artist) => {
      return {
        name: artist.name,
        genres: artist.genres,
        popularity: artist.popularity,
      };
    });
  } catch (e) {
    console.log(e);
    return null;
  }
}
export async function processTopTracks(spotifyApi: SpotifyApi) {
  try {
    // const topTracks = await spotifyApi.currentUser.topItems("tracks");
    const topTracks = data.topTracks;
    return topTracks.items.map((track) => {
      return {
        name: track.name,
        artists: track.artists.map((artist) => artist.name),
        album: track.album.name,
      };
    });
  } catch (e) {
    console.log(e);
    return null;
  }
}
export async function processSavedAlbums(spotifyApi: SpotifyApi) {
  try {
    // const savedAlbums = await spotifyApi.currentUser.albums.savedAlbums();
    const savedAlbums = data.savedAlbums;
    return savedAlbums.items.map((album) => {
      return {
        name: album.album.name,
        artists: album.album.artists.map((artist) => artist.name),
        releaseDate: album.album.release_date,
      };
    });
  } catch (e) {
    console.log(e);
    return null;
  }
}
export async function processRecentlyPlayed(
  spotifyApi: SpotifyApi,
  after?: Date
) {
  try {
    // const recentlyPlayed = await spotifyApi.player.getRecentlyPlayedTracks();
    const recentlyPlayed = data.recentlyPlayed;
    return recentlyPlayed.items
      .filter((item) => {
        const playedAt = new Date(item.played_at);
        return !after || playedAt > after;
      })
      .map((item) => {
        return {
          name: item.track.name,
          artists: item.track.artists.map((artist) => artist.name),
          album: item.track.album.name,
        };
      });
  } catch (e) {
    console.log(e);
    return null;
  }
}

export async function processCurrentlyPlaying(spotifyApi: SpotifyApi) {
  try {
    const currentlyPlaying = await spotifyApi.player.getCurrentlyPlayingTrack();
    if (!currentlyPlaying) return null;
    if (currentlyPlaying.item.type === "episode") return null;
    const item = currentlyPlaying.item as Track;
    return {
      name: currentlyPlaying.item.name,
      artists: item.artists.map((artist) => artist.name),
      album: item.album.name,
    };
  } catch (e) {
    console.log(e);
    return null;
  }
}
export async function processCurrentQueue(spotifyApi: SpotifyApi) {
  try {
    const currentQueue = await spotifyApi.player.getUsersQueue();
    return currentQueue.queue.map((item) => {
      if (item.type === "episode") return null;
      const track = item as Track;
      return {
        name: track.name,
        artists: track.artists.map((artist) => artist.name),
        album: track.album.name,
      };
    });
  } catch (e) {
    console.log("failed to get current queue; probably because not premium");
    return null;
  }
}
