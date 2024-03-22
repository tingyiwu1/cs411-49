import requests
import dotenv
import os
from openai import OpenAI

dotenv.load_dotenv()

SPOTIFY_CLIENT_ID = os.getenv("SPOTIFY_CLIENT_ID")
SPOTIFY_CLIENT_SECRET = os.getenv("SPOTIFY_CLIENT_SECRET")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

if __name__ == "__main__":
    # headers = {"Content-Type": "application/x-www-form-urlencoded"}
    # res = requests.post(
    #     f"https://accounts.spotify.com/api/token",
    #     data={
    #         "grant_type": "client_credentials",
    #         "client_id": SPOTIFY_CLIENT_ID,
    #         "client_secret": SPOTIFY_CLIENT_SECRET,
    #     },
    #     headers=headers,
    # )
    # data = res.json()

    # # doesnt work need to actually authorize a user first
    # res = requests.get(
    #     "https://api.spotify.com/v1/me/player/recently-played",
    #     headers={"Authorization": f"Bearer {data['access_token']}"},
    # )
    # data = res.json()
    # print(data)

    client = OpenAI(api_key=OPENAI_API_KEY)

    completion = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": "What is the purpose of life?"},
        ],
    )
    print(completion)
