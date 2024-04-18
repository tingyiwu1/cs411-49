import fastifyAuth from "@fastify/auth";
import { AccessToken, SpotifyApi, UserProfile } from "@spotify/web-api-ts-sdk";
import { FastifyPluginAsync } from "fastify";
import { SPOTIFY_CLIENT_ID, jwt_secret } from "../env";
import fastifyJwt from "@fastify/jwt";

export const privateRoutes: FastifyPluginAsync = async (server, opts) => {
  // await server.register(fastifyJwt, { secret: jwt_secret });
  await server.register(fastifyAuth);

  await server.decorate("spotifyApi", null);

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
      } catch (e) {
        console.log(e);
        reply.send(new Error("Unauthorized"));
      }
    },
  ]);

  await server.get("/me", { preHandler }, async (request, reply) => {
    const user = await request.spotifyApi.currentUser.profile();
    return user;
  });

  await server.get("/playlists", { preHandler }, async (request, reply) => {
    // TODO
  });
};

declare module "fastify" {
  interface FastifyRequest {
    spotifyApi: SpotifyApi;
  }
}
