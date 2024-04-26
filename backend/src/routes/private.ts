import fastifyAuth from "@fastify/auth";
import {
  AccessToken,
  SpotifyApi,
  Track,
  UserProfile,
} from "@spotify/web-api-ts-sdk";
import { FastifyPluginAsync } from "fastify";
import { FastifyRequest } from "fastify";
import { OPENAI_API_KEY, SPOTIFY_CLIENT_ID, jwt_secret } from "../env";
import { prisma } from "../prisma";
import { User } from "@prisma/client";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

export const privateRoutes: FastifyPluginAsync = async (server, opts) => {
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

  server.get("/playlists", { preHandler }, async (request, reply) => {
    const playlist = await request.spotifyApi.currentUser.playlists.playlists();
    return playlist;
  });

  interface EvaluateRequestBody {
    options: string[];
  }

  server.post("/evaluate", { preHandler }, async (request, reply) => {
    const { options } = request.body as EvaluateRequestBody;

    console.log("Selected options:", options);
    console.log("Selected :", options.join(", "));
    // Fetch relevant data based on user's selection
    const [playlists, topArtists, topTracks, savedAlbums, recentlyPlayed] =
      await Promise.all([
        options.includes("playlists")
          ? processPlaylists(request.spotifyApi)
          : null,
        options.includes("topArtists")
          ? processTopArtists(request.spotifyApi)
          : null,
        options.includes("topTracks")
          ? processTopTracks(request.spotifyApi)
          : null,
        options.includes("savedAlbums")
          ? processSavedAlbums(request.spotifyApi)
          : null,
        options.includes("recentlyPlayed")
          ? processRecentlyPlayed(request.spotifyApi)
          : null,
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

    let dataForAnalysis = [];

    // Fetch relevant data based on user's selection
    if (options.includes("playlists")) {
      const playlistsData = await processPlaylists(request.spotifyApi);
      if (playlistsData) {
        dataForAnalysis.push(playlistsData);
      }
    }

    if (options.includes("topArtists")) {
      const topArtistsData = await processTopArtists(request.spotifyApi);
      if (topArtistsData) {
        dataForAnalysis.push(topArtistsData);
      }
    }

    if (options.includes("topTracks")) {
      const topTracksData = await processTopTracks(request.spotifyApi);
      if (topTracksData) {
        dataForAnalysis.push(topTracksData);
      }
    }

    if (options.includes("savedAlbums")) {
      const savedAlbumsData = await processSavedAlbums(request.spotifyApi);
      if (savedAlbumsData) {
        dataForAnalysis.push(savedAlbumsData);
      }
    }

    if (options.includes("recentlyPlayed")) {
      const recentlyPlayedData = await processRecentlyPlayed(
        request.spotifyApi
      );
      if (recentlyPlayedData) {
        dataForAnalysis.push(recentlyPlayedData);
      }
    }

    const stream = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `Asssigned to determine a user's MBTI trait based on their music traits, which is from the user's spotify profile.
          In order to accomplish this, the user has selected what it is that they want analyed: ${options}. 
          Based on these choices/options selected to be analyzed you are to generate a holistic account of the kind fo person they are and from there determine what the MBTI trait of the user is. 
          In order to accomplish this, you could potentially do the following: dive into lyrics, mood, and themes to deciper their potential personality traits based on what they requested to be analyzed. 
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

    // // Pass data to OpenAI API for analysis
    // const analysisResult = await analyzeData(dataForAnalysis, request.openAI);

    // // Return analysis result
    // return analysisResult;
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

async function analyzeData(dataForAnalysis: any[], openAI: OpenAI) {
  try {
    // Construct the message for the OpenAI API based on the data for analysis
    const messages = [
      {
        role: "system",
        content: `You are an assignment who is trying to determine a user's MBTI trait based on their music traits, which is from the user's spotify profile.
        You will dive into the lyrics, mood, and themes to decipher their potential personality traits.
        Other things that can you factor in are the user's top artists and top tracks to generate a holistic account of the kind of person and from there be able to tell the MBTI trait of the user.
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
        Make sure to cite references to particular tracks, artists, and playlists where appropriate.`,
      },
    ];

    // Add user data from dataForAnalysis to messages
    dataForAnalysis.forEach((data) => {
      // Assuming each data object has a name property
      messages.push({
        role: "user",
        content: `Data: ${data.name}`, // Adjust content as needed based on your data structure
      });
    });

    // Call OpenAI API for chat completions
    const response = await openAI.completions.create({
      model: "text-davinci-003", // Use the appropriate model for text generation
      prompt: messages.map((msg) => `${msg.role}: ${msg.content}`).join("\n"),
      max_tokens: 150, // Adjust max tokens as needed
      temperature: 0.7, // Adjust temperature as needed
      top_p: 1.0,
      frequency_penalty: 0.0,
      presence_penalty: 0.0,
    });

    // Extract and return the completion from the response
    const completion = response.choices[0].text;
    return completion;
  } catch (error) {
    console.error("Error analyzing data with OpenAI:", error);
    throw new Error("Error analyzing data with OpenAI");
  }
}

export { analyzeData };

declare module "fastify" {
  interface FastifyRequest {
    spotifyApi: SpotifyApi;
    spotifyUser: UserProfile;
    prismaUser: User;
    openAI: OpenAI;
  }
}
