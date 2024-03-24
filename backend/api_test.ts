import dotenv from "dotenv";
import { SpotifyApi } from "@spotify/web-api-ts-sdk";
import OpenAI from "openai";

dotenv.config();

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

async function main() {
  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
    throw new Error("Spotify credentials not found");
  }
  const spotifyApi = SpotifyApi.withClientCredentials(
    SPOTIFY_CLIENT_ID,
    SPOTIFY_CLIENT_SECRET
  );
  const spotifyResponse = await spotifyApi.search("Never Gonna Give You Up", [
    "track",
  ]);
  console.log(spotifyResponse);

  if (!OPENAI_API_KEY) {
    throw new Error("OpenAI API key not found");
  }
  const openai = new OpenAI({
    apiKey: OPENAI_API_KEY,
  });
  const openaiResponse = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content: "You are a helpful assistant.",
      },
      {
        role: "user",
        content: "What is the meaning of life?",
      },
    ],
  });
  console.log(openaiResponse.choices[0]);
}

main();
