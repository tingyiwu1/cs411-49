import fastifyAuth from "@fastify/auth";
import {
  AccessToken,
  SpotifyApi,
  Track,
  UserProfile,
} from "@spotify/web-api-ts-sdk";
import { FastifyPluginAsync } from "fastify";
import { OPENAI_API_KEY, SPOTIFY_CLIENT_ID, jwt_secret } from "../env";
import { prisma } from "../prisma";
import { User } from "@prisma/client";
import data from "../../../sample_data.json";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

export const privateRoutes: FastifyPluginAsync = async (server, opts) => {
  // await server.register(fastifyJwt, { secret: jwt_secret });
  await server.register(fastifyAuth);

  server.decorate("spotifyApi", null);
  server.decorate("spotifyUser", null);
  server.decorate("prismaUser", null);
  server.decorate("openAI", openai);

  const preHandler = server.auth([
    async (request, reply) => {
      const authorization = request.headers.authorization;
      if (!authorization) {
        reply.send(new Error("Unauthorized"));
        return;
      }

      try {
        server.jwt.verify(authorization);
        const decoded = server.jwt.decode<{ token: AccessToken }>(
          authorization
        );
        if (decoded == null) throw new Error("Invalid token");
        request.spotifyApi = SpotifyApi.withAccessToken(
          SPOTIFY_CLIENT_ID,
          decoded.token
        );
        request.spotifyUser = await request.spotifyApi.currentUser.profile();
        if (!request.spotifyUser) throw new Error("get user failed");
        request.prismaUser = await prisma.user.upsert({
          where: { id: request.spotifyUser.id },
          update: {
            email: request.spotifyUser.email,
            displayName: request.spotifyUser.display_name,
          },
          create: {
            id: request.spotifyUser.id,
            email: request.spotifyUser.email,
            displayName: request.spotifyUser.display_name,
          },
        });
        if (!request.prismaUser) throw new Error("get prisma user failed");
      } catch (e) {
        console.log(e);
        reply.send(new Error("Unauthorized"));
      }
    },
  ]);

  server.get("/me", { preHandler }, async (request, reply) => {
    return request.spotifyUser;
  });

  server.get("/choices", { preHandler }, async (request, reply) => {
    const topArtists = await request.spotifyApi.currentUser.topItems("artists");
    const topTracks = await request.spotifyApi.currentUser.topItems("tracks");
    return {
      topArtists,
      topTracks,
    };
  });

  server.get("/evaluate", { preHandler }, async (request, reply) => {
    const [
      playlists,
      topArtists,
      topTracks,
      savedAlbums,
      recentlyPlayed,
      currentlyPlaying,
      currentQueue,
    ] = await Promise.all([
      processPlaylists(request.spotifyApi),
      processTopArtists(request.spotifyApi),
      processTopTracks(request.spotifyApi),
      processSavedAlbums(request.spotifyApi),
      processRecentlyPlayed(request.spotifyApi),
      processCurrentlyPlaying(request.spotifyApi),
      processCurrentQueue(request.spotifyApi),
    ]);
    const info = {
      playlists,
      topArtists,
      topTracks,
      savedAlbums,
      recentlyPlayed,
      currentlyPlaying,
      currentQueue,
    };
    const stream = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are an assistant that assesses a user's personality and mood based on the information they provide, which is from the user's spotify profile. \
            You will factor in long-term information like top artists and top tracks to generate a holistic account of the kind of person \
            the user is, and you will also consider short-term information like currently playing and current queue to gauge the user's mood. \
            Make sure to cite references to particular tracks, artists, and playlists where appropriate.

            You will respond in markdown format, with a header for each section of information. \
            `,
        },
        {
          role: "user",
          content: `Profile information: 
          ${JSON.stringify(
            Object.fromEntries(
              Object.entries(info).filter((k, v) => v !== null)
            )
          )}`,
        },
      ],
      stream: true,
    });
    let response = "";
    for await (const message of stream) {
      const delta = message.choices[0]?.delta.content;
      response += delta ?? "";
      process.stdout.write(delta ?? "");
    }
    process.stdout.write("\n");
    await prisma.historyEntry.create({
      data: {
        userId: request.prismaUser.id,
        content: response,
      },
    });
    return response;
  });
  server.get("/history", { preHandler }, async (request, reply) => {
    const history = await prisma.historyEntry.findMany({
      where: {
        userId: request.prismaUser.id,
      },
    });
    return history;
  });
};

async function processPlaylists(spotifyApi: SpotifyApi) {
  try {
    const playlists = await spotifyApi.currentUser.playlists.playlists();
    const playlistItems = await Promise.all(
      playlists.items.map(async (playlist) => {
        const tracks = await spotifyApi.playlists.getPlaylistItems(
          playlist.id,
          undefined,
          "items(track(name, artists, album(name)))"
        );
        return {
          name: playlist.name,
          description: playlist.description,
          tracks: tracks.items.map((item) => {
            return {
              name: item.track.name,
              artists: item.track.artists.map((artist) => artist.name),
              album: item.track.album.name,
            };
          }),
        };
      })
    );
    return playlists.items.map((playlist, i) => {
      return {
        name: playlist.name,
        description: playlist.description,
        tracks: playlistItems[i].tracks,
      };
    });
  } catch (e) {
    console.log(e);
    return null;
  }
}
async function processTopArtists(spotifyApi: SpotifyApi) {
  try {
    const topArtists = await spotifyApi.currentUser.topItems("artists");
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
async function processTopTracks(spotifyApi: SpotifyApi) {
  try {
    const topTracks = await spotifyApi.currentUser.topItems("tracks");
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
async function processSavedAlbums(spotifyApi: SpotifyApi) {
  try {
    const savedAlbums = await spotifyApi.currentUser.albums.savedAlbums();
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
async function processRecentlyPlayed(spotifyApi: SpotifyApi) {
  try {
    const recentlyPlayed = await spotifyApi.player.getRecentlyPlayedTracks();
    return recentlyPlayed.items.map((item) => {
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
async function processCurrentlyPlaying(spotifyApi: SpotifyApi) {
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
async function processCurrentQueue(spotifyApi: SpotifyApi) {
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

declare module "fastify" {
  interface FastifyRequest {
    spotifyApi: SpotifyApi;
    spotifyUser: UserProfile;
    prismaUser: User;
    openAI: OpenAI;
  }
}
