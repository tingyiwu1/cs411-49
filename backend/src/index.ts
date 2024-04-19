import fastify from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import OpenAI from "openai";
import { privateRoutes } from "./routes/private";
import { OPENAI_API_KEY, jwt_secret } from "./env";
import { oauthRoutes } from "./routes/oauth";
import fastifyJwt from "@fastify/jwt";

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

let server = fastify({ logger: true });

server.register(cors, {
  origin: ["http://localhost:5173"],
  methods: ["GET", "POST", "OPTIONS"],
});
server.register(cookie, {});
server.register(fastifyJwt, { secret: jwt_secret });
server.register(oauthRoutes);

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

server.register(privateRoutes);

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
