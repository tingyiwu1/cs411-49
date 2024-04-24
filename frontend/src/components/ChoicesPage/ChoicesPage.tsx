import { Artist, Page, Track } from "@spotify/web-api-ts-sdk";
import axios from "axios";
import { useEffect, useState } from "react";

type Choices = {
  topArtists: Page<Artist>;
  topTracks: Page<Track>;
};

const ChoicesPage = () => {
  const [choices, setChoices] = useState<Choices | null>(null);

  useEffect(() => {
    const getChoice = async () => {
      const response = await axios.get<Choices>("/choices");
      setChoices(response.data);
    };
    void getChoice();
  }, []);

  const tracks =
    choices?.topTracks.items.map((track) => {
      return {
        name: track.name,
        duration: track.duration_ms,
      };
    }) ?? [];

  return (
    <div>
      <h1>Choices Page</h1>
      {tracks.map((track) => {
        return (
          <div>
            <h2>{track.name}</h2>
            <p>{track.duration}</p>
          </div>
        );
      })}
      <div>{JSON.stringify(choices, null, 2)}</div>
    </div>
  );
};

export default ChoicesPage;
