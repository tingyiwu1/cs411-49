import dotenv from "dotenv";
import fastify, { RouteShorthandOptions } from "fastify";
import cors from "@fastify/cors";
import { SpotifyApi } from "@spotify/web-api-ts-sdk";
import OpenAI from "openai";
import { PrismaClient, User, Post } from '@prisma/client'


const prisma = new PrismaClient()

dotenv.config();

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET || !OPENAI_API_KEY)
  throw new Error("Missing credentials");

const spotifyApi = SpotifyApi.withClientCredentials(
  SPOTIFY_CLIENT_ID,
  SPOTIFY_CLIENT_SECRET
);
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

const server = fastify({ logger: true });

server.get("/ping", async (request, reply) => {
  return { hello: "world" };
});

server.post<{ Body: { foo: string } }>("/test", async (request, reply) => {
  console.log(request.body.foo);
  const playlist = request.body.foo; // replace with fetching and processing actual playlist data

  // placeholder prompts; need to play with this
  const openaiResponse = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content: "You are a helpful assistant.",
      },
      {
        role: "user",
        content: `Based on a person's playlist "${playlist}", what would they say is the meaning of life?`,
      },
    ],
  });

  const choice = openaiResponse.choices[0].message.content;

  return { body: choice };
});

const start = async () => {
  const userFound = await prisma.user.findUnique({

    where:{ 
        email: 'sdfhs'
    }
  
  })
  // const user = await prisma.user.create({
  //   data: {
  //     email: 'sdfhs',
  //     username: 'deez',
  //     firstname: 'sbsdfj',
  //     lastname: 'sdhfjskd',
  //     spotifyAPI: 123,

  //   }
  // })
  // console.log(user)
  console.log(userFound)

  try {
    await server.register(cors, {
      origin: ["http://localhost:5173"],
      methods: ["GET", "POST", "OPTIONS"],
    });

    await server.listen({ port: 3000 });

    const address = server.server.address();
    const port = typeof address === "string" ? address : address?.port;
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
