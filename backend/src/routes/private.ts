import fastifyAuth from "@fastify/auth";
import {
  AccessToken,
  SpotifyApi,
  Track,
  UserProfile,
} from "@spotify/web-api-ts-sdk";
import { FastifyPluginAsync } from "fastify";
import { FastifyRequest } from "fastify";
import { OPENAI_API_KEY, SPOTIFY_CLIENT_ID, GENIUS_ACCESS_TOKEN } from "../env";
import { prisma } from "../prisma";
import { Assessment, User } from "@prisma/client";
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
import {
  playedInTimeframe,
  processPlaylists,
  processRecentlyPlayed,
  processSavedAlbums,
  processTopArtists,
  processTopTracks,
} from "../fetchers/spotify";
import { DateTime } from "luxon";
import * as Genius from "genius-lyrics";
import { getSongLyrics } from "../fetchers/genius";
import { shuffle } from "../util";
import { getCompletion } from "../fetchers/openai";

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

const genius = new Genius.Client(GENIUS_ACCESS_TOKEN);

export const privateRoutes: FastifyPluginAsync = async (server, opts) => {
  // await server.register(fastifyJwt, { secret: jwt_secret });
  let generatedMessage = ""; // Variable to store the generated message
  await server.register(fastifyAuth);

  server.decorate("spotifyApi", null);
  server.decorate("spotifyUser", null);
  server.decorate("prismaUser", null);

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
        const prismaUser = await prisma.user.upsert({
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
        const selectedAssessments = await prisma.assessment.findMany({
          where: {
            userId: prismaUser.id,
            selected: true,
          },
        });
        let selectedAssessment = null;
        if (selectedAssessments.length > 0) {
          const [first, ...rest] = selectedAssessments;
          if (rest) {
            await prisma.assessment.updateMany({
              where: {
                id: {
                  in: rest.map((a) => a.id),
                },
              },
              data: {
                selected: false,
              },
            });
          }
          selectedAssessment = first;
        }
        request.prismaUser = {
          ...prismaUser,
          selectedAssessment,
        };
        if (!request.prismaUser) throw new Error("get prisma user failed");
      } catch (e) {
        console.log(e);
        reply.send(new Error("Unauthorized"));
      }
    },
  ]);

  server.get("/me", { preHandler }, async (request, reply) => {
    const selectedAssessment = request.prismaUser.selectedAssessment
      ? {
          id: request.prismaUser.selectedAssessment.id,
          createdAt:
            request.prismaUser.selectedAssessment.createdAt.toISOString(),
          selected: request.prismaUser.selectedAssessment.selected,
          ...JSON.parse(request.prismaUser.selectedAssessment.content),
        }
      : null;
    return {
      ...request.spotifyUser,
      created_at: request.prismaUser.createdAt.toISOString(),
      selectedAssessment,
    };
  });

  server.get("/playlists", { preHandler }, async (request, reply) => {
    const playlists = await processPlaylists(request.spotifyApi);
    return playlists;
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
        content: `Assigned to determine a user's personaliy based on their music traits, which is from the user's spotify profile. \
          In order to accomplish this, the user has selected what it is that they want analyed: ${options}. \
          For each of the selected options, reference the corresponding user data and create an analysis based on the user's personality based on that category. \
          Do not analyze the individual items in each category, but rather what the data as a whole says about the user's personality. Each analysis should be in paragraph form. \

          Address the user directly and use the tone of the analysis that follows a personality quiz. Mention traits the user might have. Reference lyrics, mood, themes, and other relevatant data where appropriate. \
          Use a confident tone, and do not use speculative language. 

          You will respond with only a JSON object in the following format:
          {
            "playlists": {analysis string},
            "topArtists": {analysis string},
            "topTracks": {analysis string},
            "savedAlbums": {analysis string},
            "recentlyPlayed": {analysis string}
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

    const assessment = await prisma.assessment.create({
      data: {
        userId: request.prismaUser.id,
        content: JSON.stringify(assessmentContent),
        selected: request.prismaUser.selectedAssessment == null,
      },
    });

    return {
      id: assessment.id,
      createdAt: assessment.createdAt.toISOString(),
      selected: assessment.selected,
      ...assessmentContent,
    };
  });

  server.get("/recent", { preHandler }, async (request, reply) => {
    const d = DateTime.now().minus({ days: 7 });
    const tracks = playedInTimeframe(request.spotifyApi, d);
    return tracks;
  });

  server.post<{
    Body: {
      start: string;
    };
  }>("/mood", { preHandler }, async (request, reply) => {
    // return `Reflective and complex emotions swirl with a mix of contemplation and empathy. <span data-song="Earth, Wind & Fire">왜 넌 갈팡질팡 날 헛갈려 해</span> captures the confusion and desire for clarity, while <span data-song="A Mirage">Coming to find I need to pick up my slack, Realize I can't go back</span> depicts a self-awareness and determination to improve and move ahead. Compassion threads through, with <span data-song="Make Up (Feat. Crush)">Baby, babe, hate to see you cry</span> emphasizing concern and longing for resolution.`;
    const { start } = request.body;
    console.log(request.prismaUser);
    if (!request.prismaUser.selectedAssessment) {
      return { error: "NO_SELECTED_ASSESSMENT" };
    }
    const d = DateTime.fromISO(start);
    if (!d.isValid) return reply.code(400).send({ error: "Invalid date" });

    const tracks =
      (await playedInTimeframe(
        request.spotifyApi,
        d.startOf("week"),
        d.endOf("week")
      )) ?? [];

    shuffle(tracks);

    const lyrics = await Promise.all(
      tracks.map(async (track) => {
        const lyric = await getSongLyrics(genius, track.name, track.artists);
        return lyric;
      })
    );

    const tracksWithLyrics = tracks.map((track, i) => ({
      ...track,
      lyrics: lyrics[i],
    }));

    const messages: ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: `Assigned to generate a blurb about the user's mood based on the music they've been listening to in the last week. \
        Base your analysis on their overall personality as described below. Do not make any assessment of their overall taste in music, but rather focus on \
        how the music they've been listening recently reflects their mood. Find and quote specific lines from the lyrics provided to support your analysis. \
        If the quote is not in English, include a translation in parentheses. Indicate the song that the quote is from. Cite at least 3 songs.

        User's personality:
        ${JSON.stringify(request.prismaUser.selectedAssessment)}
        `,
      },
      {
        role: "user",
        content: `Recently listened tracks:
        ${JSON.stringify(tracksWithLyrics)}`,
      },
    ];

    const mood = await getCompletion(openai, messages, "gpt-3.5-turbo");

    messages.push({
      role: "system",
      content: `
      Generate a JSON array of the songs mentioned in the blurb. Each entry should be a string with the name of the song exactly as specified \
      in the user's playlist. Make sure every single song mentioned is in the array. Do not include any other songs in the user's playlist that \
      are not mentioned in the blurb. The array should only contain the names of songs that are in the generate blurb. Do not output anything else. \
      Do not wrap wrap the output in a code block.
      `,
    });

    const mentionedSongsResponse = await getCompletion(
      openai,
      messages,
      "gpt-4-turbo"
    );

    const mentionedSongs = JSON.parse(
      mentionedSongsResponse.content ?? "[]"
    ) as string[];

    messages[1].content = `Recently listened tracks: ${JSON.stringify(
      tracksWithLyrics.filter((t) => mentionedSongs.includes(t.name))
    )}`;

    messages.push({
      role: "system",
      content: `
      For each song mentioned in the blurb, find a quote from its lyrics that best supports the mood described in the blurb. \
      If the blurb includes a quote for the song, include the quote from the blurb instead of finding a new one. \
      Only consider the songs that are mentioned in the blurb. Make sure every song mentioned in the blurb is \
      included as a key. Do not include any other songs. Ignore all other songs on the user's \
      playlist that were not mentioned in the blurb. \

      Respond with a JSON object where the key is the song name and the value is the quote. Do not output anything else. \
      Do not wrap wrap the output in a code block.
      `,
    });

    const quotes = await getCompletion(openai, messages, "gpt-3.5-turbo");

    messages.push({
      role: "system",
      content: `
      Based on your understanding of the user's mood, generate a summary that describes the vibe \
      of the user's mood. Use concise and descriptive language, and avoid using complete sentences. Weave the quotes \
      into the summary in a way that makes sense. Do not use the quotes as citations to justify your description, but rather \
      as self-standing parts of the description itself. Do not explain what each quote entails.\

      In your summary, wrap all quotes in <span> tags with the song title in the data-song attribute.
      e.g. <span data-song="song title">quote</span>
      `,
    });

    const summary = await getCompletion(openai, messages, "gpt-4-turbo");

    return summary.content;
  });

  server.get("/assessments", { preHandler }, async (request, reply) => {
    const assessments = await prisma.assessment.findMany({
      where: {
        userId: request.prismaUser.id,
      },
    });
    return assessments.map((a) => ({
      id: a.id,
      createdAt: a.createdAt.toISOString(),
      selected: a.selected,
      ...JSON.parse(a.content),
    }));
  });

  server.get<{
    Params: { id: string };
  }>("/assessments/:id", { preHandler }, async (request, reply) => {
    const { id } = request.params;
    const assessment = await prisma.assessment.findUnique({
      where: {
        id: id,
      },
    });
    if (!assessment) {
      reply.code(404).send({ error: "Assessment not found" });
    } else {
      return {
        id: assessment.id,
        createdAt: assessment.createdAt.toISOString(),
        selected: assessment.selected,
        ...JSON.parse(assessment.content),
      };
    }
  });

  server.post<{
    Body: {
      assessmentId: string;
    };
  }>("/select_assessment", { preHandler }, async (request, reply) => {
    const { assessmentId } = request.body;
    try {
      const assessment = await prisma.assessment.findUnique({
        where: {
          id: assessmentId,
        },
      });
      if (!assessment) {
        reply.code(404).send({ error: "Assessment not found" });
      } else {
        return {
          id: assessment.id,
          createdAt: assessment.createdAt.toISOString(),
          selected: assessment.selected,
          ...JSON.parse(assessment.content),
        };
      }
    } catch (error) {
      console.error("Error selecting assessment:", error);
      reply.code(500).send({ error: "Internal Server Error" });
    }
  });
};

declare module "fastify" {
  interface FastifyRequest {
    spotifyApi: SpotifyApi;
    spotifyUser: UserProfile;
    prismaUser: User & {
      selectedAssessment: Assessment | null;
    };
  }
}
