import { useContext, useEffect, useMemo, useState } from "react";
import { LoginContext } from "../../utils";
import axios from "axios";
import { useNavigate } from "react-router-dom";

type MoodResponse =
  | string
  | {
      error: "NO_SELECTED_ASSESSMENT";
    };

export const MoodPage: React.FC = () => {
  const { user, loading } = useContext(LoginContext);

  const [mood, setMood] = useState<string | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    if (loading || user == null) return;

    if (user.selectedAssessment == null) {
      navigate("/analyze");
    }

    axios
      .post<MoodResponse>("/mood", { start: "2024-04-24" })
      .then((response) => {
        console.log(response);
        if (typeof response.data === "string") {
          setMood(response.data);
        } else {
          navigate("/analyze");
        }
      });
  }, [user, loading, navigate]);

  const matches = useMemo(() => {
    if (mood == null) {
      return [];
    }
    const [...matches] = mood.matchAll(
      /<span data-song=".+?">.+?<\/span>|.+?(?=<span data-song=".+?")/g,
    );
    if (!matches) {
      return [];
    }
    return matches.map((matches, i) => {
      const [match] = matches;
      if (match.startsWith("<span")) {
        const songMatch = /<span data-song="(.+?)">(.+?)<\/span>/.exec(match);
        if (songMatch) {
          return (
            <Lyric
              song={songMatch[1]}
              lyric={songMatch[2]}
              key={`lyric-${i}`}
            />
          );
        }
        return <>{match}</>;
      }
      return <>{match}</>;
    });
  }, [mood]);

  return (
    <div className="flex flex-col items-center">
      <div className="mx-20 mt-10 flex flex-row items-center justify-between gap-40 rounded-xl bg-gradient-to-t from-[#BBA9A9] to-[#978888] px-3 py-2 text-xl text-white">
        <div>
          {new Date().toLocaleDateString("default", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </div>
        <div>
          {new Date().toLocaleTimeString("default", {
            minute: "numeric",
            hour: "numeric",
          })}
        </div>
      </div>
      <div className="mx-20 mt-5 rounded-xl bg-gradient-to-t from-[#DCEEC5] to-[#C5E5A5] p-3 text-lg text-[#755B5B]">
        <div className="text-center text-2xl font-bold">This Week's Mood</div>
        {mood == null ? <div>loading...</div> : <div>{matches}</div>}
      </div>
    </div>
  );
};

const Lyric: React.FC<{ song: string; lyric: string }> = ({ song, lyric }) => {
  const [showSong, setShowSong] = useState(false);
  return (
    <>
      <span
        className="font-bold text-[#4A3434]"
        title={song}
        onMouseEnter={() => setShowSong(true)}
        onMouseLeave={() => setShowSong(false)}
      >
        {showSong && (
          <span className="absolute rounded-md border-2 border-[#4A3434] bg-[#F4F0E3] px-3 py-1 text-sm">
            {song}
          </span>
        )}
        "{lyric}"
      </span>
    </>
  );
};
