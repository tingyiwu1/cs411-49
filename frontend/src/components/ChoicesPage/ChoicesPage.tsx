import { Artist, Page, Track } from "@spotify/web-api-ts-sdk";
import axios from "axios";
import { useEffect, useState } from "react";

type Choices = {
  topArtists: Page<Artist>;
  topTracks: Page<Track>;
};

const ChoicesPage = () => {
  const [choices, setChoices] = useState<Choices | null>(null);

  const [thing, setThing] = useState(0);

  let thing2 = 0;

  useEffect(() => {
    const getChoice = async () => {
      const response = await axios.get<Choices>("/choices");
      setChoices(response.data);
    };
    void getChoice();
    console.log('sdfhsdjkf')
  }, []);

  useEffect(() => {
    console.log('look a reload')

  }, [])

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
      <div>{thing}</div>
      <button onClick={() => {
        setThing(thing + 1)
      }}>click me</button>
      <div>{thing2}</div>
      <button onClick={() => {
        thing2++
      }}>click me</button>
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
