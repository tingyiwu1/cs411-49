import dotenv from "dotenv";

dotenv.config();

const SPOTIFY_CLIENT_ID = "abf851abce2b43ebb3bdc03476c38573";
const SPOTIFY_CLIENT_SECRET = "3295b50466ad410b93614a14b4b3edc6";
const OPENAI_API_KEY = "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";
const GENIUS_ACCESS_TOKEN = "Qn3V5vL2x_a5VPe2uqnkL_9shHKSsn-jOJ_lNJ4kxvgJrPsfb2qRF41UeUswR76z";

const jwt_secret = "supersecret";

if (
  !SPOTIFY_CLIENT_ID ||
  !SPOTIFY_CLIENT_SECRET ||
  !OPENAI_API_KEY ||
  !GENIUS_ACCESS_TOKEN
)
  throw new Error("Missing credentials");

export {
  SPOTIFY_CLIENT_ID,
  SPOTIFY_CLIENT_SECRET,
  OPENAI_API_KEY,
  jwt_secret,
  GENIUS_ACCESS_TOKEN,
};