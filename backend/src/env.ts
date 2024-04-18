import dotenv from "dotenv";

dotenv.config();

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID ?? "";
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET ?? "";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY ?? "";

const jwt_secret = "supersecret";

if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET || !OPENAI_API_KEY)
  throw new Error("Missing credentials");

export { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, OPENAI_API_KEY, jwt_secret };
