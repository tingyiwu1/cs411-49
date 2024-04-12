import dotenv from "dotenv";
import fastify, { RouteShorthandOptions } from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import oauthPlugin from "@fastify/oauth2";
import { SpotifyApi, AccessToken } from "@spotify/web-api-ts-sdk";
import OpenAI from "openai";
import { PrismaClient, User, Post } from "@prisma/client";
import axios from "axios";

const prisma = new PrismaClient();

dotenv.config();

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

console.log(SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, OPENAI_API_KEY);

if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET || !OPENAI_API_KEY)
  throw new Error("Missing credentials");

const spotifyRedirectUri = "http://localhost:3000/callback";

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

const server = fastify({ logger: true });

server.register(cors, {
  origin: ["http://localhost:5173"],
  methods: ["GET", "POST", "OPTIONS"],
});
server.register(cookie, {});
server.register(oauthPlugin, {
  name: "spotifyOAuth2",
  credentials: {
    client: {
      id: SPOTIFY_CLIENT_ID,
      secret: SPOTIFY_CLIENT_SECRET,
    },
    auth: oauthPlugin.SPOTIFY_CONFIGURATION,
  },
  startRedirectPath: "/login",
  callbackUri: spotifyRedirectUri,
  scope: ["user-read-private", "user-read-email"],
});

server.get("/ping", async (request, reply) => {
  return { hello: "world" };
});

server.get<{
  Querystring: {
    code?: string;
  };
}>("/callback", async (request, reply) => {
  const { code } = request.query;

  const res = await axios.post(
    "https://accounts.spotify.com/api/token",
    {
      code,
      redirect_uri: spotifyRedirectUri,
      grant_type: "authorization_code",
    },
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(
          `${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`
        ).toString("base64")}`,
      },
    }
  );
  console.log(res.data);
  if (res.status !== 200) {
    reply.redirect("/invalid_token");
  }
  const { access_token, token_type, expires_in, refresh_token } = res.data;
  const token: AccessToken = {
    access_token,
    refresh_token,
    expires_in,
    token_type,
  };
  const spotifyApi = SpotifyApi.withAccessToken(SPOTIFY_CLIENT_ID, token);
  const user = await spotifyApi.currentUser.profile();
  reply.send(user);
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
  // const userFound = await prisma.user.findUnique({
  //   where: {
  //     email: "sdfhs",
  //   },
  // });
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
  // console.log(userFound);

  try {
    await server.listen({ port: 3000 });

    const address = server.server.address();
    const port = typeof address === "string" ? address : address?.port;
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
