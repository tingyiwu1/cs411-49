import fastifyAuth from "@fastify/auth";
import { AccessToken, SpotifyApi, UserProfile } from "@spotify/web-api-ts-sdk";
import { FastifyPluginAsync } from "fastify";
import { SPOTIFY_CLIENT_ID, jwt_secret } from "../env";
import fastifyJwt from "@fastify/jwt";
import { prisma } from "../prisma";
import { User } from "@prisma/client";

export const privateRoutes: FastifyPluginAsync = async (server, opts) => {
  // await server.register(fastifyJwt, { secret: jwt_secret });
  await server.register(fastifyAuth);

  await server.decorate("spotifyApi", null);
  await server.decorate("spotifyUser", null);
  await server.decorate("prismaUser", null);

  const preHandler = server.auth([
    async (request, reply) => {
      const authorization = request.headers.authorization;
      if (!authorization) {
        reply.send(new Error("Unauthorized"));
        return;
      }

      try {
        await server.jwt.verify(authorization);
        const decoded = await server.jwt.decode<{ token: AccessToken }>(
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
    // TODO
  });
};

declare module "fastify" {
  interface FastifyRequest {
    spotifyApi: SpotifyApi;
    spotifyUser: UserProfile;
    prismaUser: User;
  }
}
