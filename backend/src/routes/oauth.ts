import { FastifyPluginAsync } from "fastify";
import oauthPlugin from "@fastify/oauth2";
import fastifyJwt from "@fastify/jwt";
import { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, jwt_secret } from "../env";
import axios from "axios";
import { AccessToken, SpotifyApi } from "@spotify/web-api-ts-sdk";

const spotifyRedirectUri = "http://localhost:3000/callback";

export const oauthRoutes: FastifyPluginAsync = async (server, opts) => {
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
    callbackUriParams: {},
    scope: [
      "user-read-private",
      "user-read-email",
      "user-read-currently-playing",
      "user-read-playback-state",
      "user-read-recently-played",
      "user-library-read",
      "user-top-read",
      "playlist-read-private",
    ],
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
    console.log(token, user);
    const jwt = server.jwt.sign({ token });
    reply.redirect("http://localhost:5173/login?jwt=" + jwt);
  });

  server.post<{
    Body: {
      refresh_token: string;
    };
  }>("/refresh-token", async (request, reply) => {
    const { refresh_token } = request.body;

    const res = await axios.post(
      "https://accounts.spotify.com/api/token",
      {
        client_id: SPOTIFY_CLIENT_ID,
        grant_type: "refresh_token",
        refresh_token,
      },
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );
    console.log(res.data);
    const token: AccessToken = res.data;
    reply.send(token);
  });
};
