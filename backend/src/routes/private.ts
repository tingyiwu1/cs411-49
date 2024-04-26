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
import * as data from "../../../sample_data.json";
import OpenAI from "openai";
import {
  ChatCompletionMessage,
  ChatCompletionMessageParam,
} from "openai/resources";
import {
  AssessmentCategories,
  AssessmentContent,
  AssessmentMBTI,
  AssessmentPersonality,
} from "../types";

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

export const privateRoutes: FastifyPluginAsync = async (server, opts) => {
  // await server.register(fastifyJwt, { secret: jwt_secret });
  let generatedMessage = ""; // Variable to store the generated message
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

  server.post<{
    Body: { options: string[] };
  }>("/evaluate", { preHandler }, async (request, reply) => {
    const { options } = request.body;

    if (options.length === 0) {
      throw new Error("No options selected");
    }
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
    };

    const messages: ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: `Asssigned to determine a user's personaliy based on their music traits, which is from the user's spotify profile. \
          In order to accomplish this, the user has selected what it is that they want analyed: ${options}. \
          For each of the selected options, reference the corresponding user data and create an analysis based on the user's personality based on that category. \
          Do not analyze the individual items in each category, but rather what the data as a whole says about the user's personality. Each analysis should be in paragraph form. \

          Address the user directly and use the tone of the analysis that follows a personality quiz. Mention traits the user might have. Reference lyrics, mood, themes, and other relevatant data where appropriate. \
          Use a confident tone, and do not use speculative language. 

          You will respond with only a JSON object in the following format:
          {
            "playlists": "analysis",
            "topArtists": "analysis",
            "topTracks": "analysis",
            "savedAlbums": "analysis",
            "recentlyPlayed": "analysis"
          }
          Only include the categories that the user selected. If a particular field is missing from the provided data, do not include it in the response object. 
          `,
      },
      {
        role: "user",
        content: `Profile information: 
        ${JSON.stringify(
          Object.fromEntries(Object.entries(info).filter((k, v) => v !== null))
        )}`,
      },
    ];

    const stream = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages,
      stream: true,
    });
    const response: ChatCompletionMessage = {
      role: "assistant",
      content: "",
    };
    for await (const message of stream) {
      const delta = message.choices[0]?.delta.content ?? "";
      response.content += delta;
      process.stdout.write(delta);
    }
    process.stdout.write("\n");

    const categories = JSON.parse(
      response.content ?? "{}"
    ) as AssessmentCategories;

    messages.push(response);

    messages.push({
      role: "system",
      content: `
      Based on this analysis, generate a holistic account of the kind of person the user is. In order to accomplish this, \
      you could potentially do the following: dive into lyrics, mood, and themes to deciper their potential personality \
      traits based on what they requested to be analyzed.
      
      Respond with a JSON object where the key is the "personality" and the value is the analysis. Do not output anything else.
      `,
    });

    const stream2 = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages,
      stream: true,
    });

    const response2: ChatCompletionMessage = {
      role: "assistant",
      content: "",
    };

    for await (const message of stream2) {
      const delta = message.choices[0]?.delta.content ?? "";
      response2.content += delta;
      process.stdout.write(delta);
    }

    const personality = JSON.parse(
      response2.content ?? "{}"
    ) as AssessmentPersonality;

    messages.push(response2);

    messages.push({
      role: "system",
      content: `
      Based on this analysis, determine the top 3 most likely MBTI traits of the user. Provide an explanation for each of the \
      traits based on the analysis you have done. 
      
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

      Respond only with a JSON array of the top 3 MBTI traits, where each entry is an object with the following keys:
      - trait: the MBTI trait
      - explanation: an explanation of why this trait was chosen
      Do not output anything else.
      `,
    });

    const stream3 = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages,
      stream: true,
    });

    const response3: ChatCompletionMessage = {
      role: "assistant",
      content: "",
    };

    for await (const message of stream3) {
      const delta = message.choices[0]?.delta.content ?? "";
      response3.content += delta;
      process.stdout.write(delta);
    }

    process.stdout.write("\n");

    const mbtiTraits = JSON.parse(
      response3.content ?? "[]"
    ) as AssessmentMBTI[];

    // await prisma.historyEntry.create({
    //   data: {
    //     userId: request.prismaUser.id,
    //     content: response,
    //   },
    // });
    const assessmentContent: AssessmentContent = {
      categories,
      personality: personality.personality,
      mbtiTraits,
    };

    await prisma.assessment.create({
      data: {
        userId: request.prismaUser.id,
        content: JSON.stringify(assessmentContent),
      },
    });

    return assessmentContent;
  });

  server.get("/assessments", { preHandler }, async (request, reply) => {
    const assessments = await prisma.assessment.findMany({
      where: {
        userId: request.prismaUser.id,
      },
    });
    return assessments;
  });
};

async function processPlaylists(spotifyApi: SpotifyApi) {
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
async function processTopArtists(spotifyApi: SpotifyApi) {
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
async function processTopTracks(spotifyApi: SpotifyApi) {
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
async function processSavedAlbums(spotifyApi: SpotifyApi) {
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
async function processRecentlyPlayed(spotifyApi: SpotifyApi) {
  try {
    // const recentlyPlayed = await spotifyApi.player.getRecentlyPlayedTracks();
    const recentlyPlayed = data.recentlyPlayed;
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
