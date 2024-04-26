import fastifyAuth from "@fastify/auth";
import {
  AccessToken,
  SpotifyApi,
  Track,
  UserProfile,
} from "@spotify/web-api-ts-sdk";
import { FastifyPluginAsync} from "fastify";
import { FastifyRequest } from 'fastify';
import { OPENAI_API_KEY, SPOTIFY_CLIENT_ID, jwt_secret } from "../env";
import { prisma } from "../prisma";
import { User } from "@prisma/client";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

export const privateRoutes: FastifyPluginAsync = async (server, opts) => {
  // await server.register(fastifyJwt, { secret: jwt_secret });
  let generatedMessage = ''; // Variable to store the generated message
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

  await server.get("/me", { preHandler }, async (request, reply) => {
    return request.spotifyUser;
  });

  await server.get("/playlists", { preHandler }, async (request, reply) => {
    const playlist = await request.spotifyApi.currentUser.playlists.playlists();
    return playlist;
  });

  interface EvaluateRequestBody {
    options: string[];
  }
  
  // Define a new endpoint to retrieve the message
  server.get("/message", async (request, reply) => {
    try {
      // Send the generated message in the response
      reply.send({ message: generatedMessage });
    } catch (error) {
      console.error("Error retrieving message:", error);
      reply.code(500).send({ error: "Internal Server Error" });
    }
  });  

  await server.post("/evaluate", { preHandler }, async (request, reply) => {
    const { options } = request.body as EvaluateRequestBody;

    console.log("Selected options:", options);
    console.log("Selected :", options.join(", "));
    // Fetch relevant data based on user's selection
    const [
      playlists,
      topArtists,
      topTracks,
      savedAlbums,
      recentlyPlayed,
    ] = await Promise.all([
      options.includes("playlists") ? processPlaylists(request.spotifyApi) : null,
      options.includes("topArtists") ? processTopArtists(request.spotifyApi) : null,
      options.includes("topTracks") ? processTopTracks(request.spotifyApi) : null,
      options.includes("savedAlbums") ? processSavedAlbums(request.spotifyApi) : null,
      options.includes("recentlyPlayed") ? processRecentlyPlayed(request.spotifyApi) : null,
      // Add similar checks for other data
    ]);
    const info = {
      playlists,
      topArtists,
      topTracks,
      savedAlbums,
      recentlyPlayed,
      //currentlyPlaying,
      //currentQueue,
   };
    
    const stream = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `Asssigned to determine a user's MBTI trait based on their music traits, which is from the user's spotify profile.
          In order to accomplish this, the user has selected what it is that they want analyed: ${options}. 
          Based on these choices/options selected to be analyzed you are to generate a holistic account of the kind fo person they are and from there determine what the MBTI trait of the user is. 
          In order to accomplish this, you could potentially do the following: dive into lyrics, mood, and themes to deciper their potential personality traits based on what they requested to be analyzed. 
          Before presenting the analyzed paragraph indicate what the selected options are, a user profile overview, then personality analysis based on music preferences.
          Finally, indicate the MBTI Trait Prediction
          There are 16 MBTI results and answers to choose from:
            ISTJ - Introverted, Sensing, Thinking, Judging
            ISFJ - Introverted, Sensing, Feeling, Judging
            INFJ - Introverted, Intuitive, Feeling, Judging
            INTJ - Introverted, Intuitive, Thinking, Judging
            ISTP - Introverted, Sensing, Thinking, Perceiving
            ISFP - Introverted, Sensing, Feeling, Perceiving
            INFP - Introverted, Intuitive, Feeling, Perceiving
            INTP - Introverted, Intuitive, Thinking, Perceiving
            ESTP - Extraverted, Sensing, Thinking, Perceiving
            ESFP - Extraverted, Sensing, Feeling, Perceiving
            ENFP - Extraverted, Intuitive, Feeling, Perceiving
            ENTP - Extraverted, Intuitive, Thinking, Perceiving
            ESTJ - Extraverted, Sensing, Thinking, Judging
            ESFJ - Extraverted, Sensing, Feeling, Judging
            ENFJ - Extraverted, Intuitive, Feeling, Judging
            ENTJ - Extraverted, Intuitive, Thinking, Judging
            Make sure to cite references to where appropriate.

            You will respond in markdown format, with a header for each section of information. Particularly what they selected in options \
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
      generatedMessage += delta ?? "";
      process.stdout.write(delta ?? "");
    }
    process.stdout.write("\n");
    return { response, generatedMessage };
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

