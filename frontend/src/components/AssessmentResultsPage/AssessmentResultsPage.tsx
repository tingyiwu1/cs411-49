import { useParams } from "react-router-dom";
import { Assessment } from "../../types";
import { useEffect, useState } from "react";
import axios from "axios";

type AssessmentResultsPageParams = {
  id: string;
};

export const AssessmentResultsPage: React.FC = () => {
  const { id } = useParams<AssessmentResultsPageParams>();
  const [assessment, setAssessment] = useState<Assessment | null>(null);

  useEffect(() => {
    axios.get<Assessment>(`/assessments/${id}`).then((response) => {
      setAssessment(response.data);
    });
  }, [id]);
  return (
    <div className="flex flex-col items-center">
      {assessment ? (
        <div>
          <div className="mx-20 mt-5 rounded-xl bg-gradient-to-t from-[#DCEEC5] to-[#C5E5A5] p-3 text-lg text-[#755B5B]">
            <h1 className="text-center text-2xl font-bold">
              {assessment.title}
            </h1>
            <p>{assessment.personality}</p>
          </div>
          {assessment.categories.playlists && (
            <div className="mx-20 mt-5 rounded-xl bg-gradient-to-t from-[#DCEEC5] to-[#C5E5A5] p-3 text-lg text-[#755B5B]">
              <div className="text-center text-xl font-bold">Playlists</div>
              {assessment.categories.playlists}
            </div>
          )}
          {assessment.categories.topArtists && (
            <div className="mx-20 mt-5 rounded-xl bg-gradient-to-t from-[#DCEEC5] to-[#C5E5A5] p-3 text-lg text-[#755B5B]">
              <div className="text-center text-xl font-bold">Artists</div>
              {assessment.categories.topArtists}
            </div>
          )}
          {assessment.categories.topTracks && (
            <div className="mx-20 mt-5 rounded-xl bg-gradient-to-t from-[#DCEEC5] to-[#C5E5A5] p-3 text-lg text-[#755B5B]">
              <div className="text-center text-xl font-bold">Tracks</div>
              {assessment.categories.topTracks}
            </div>
          )}
          {assessment.categories.savedAlbums && (
            <div className="mx-20 mt-5 rounded-xl bg-gradient-to-t from-[#DCEEC5] to-[#C5E5A5] p-3 text-lg text-[#755B5B]">
              <div className="text-center text-xl font-bold">Albums</div>
              {assessment.categories.savedAlbums}
            </div>
          )}
          <div>
            <div className="mx-20 mt-5 rounded-xl bg-[#FFBEB9] p-3 text-lg text-[#755B5B]">
              <h2 className="text-center text-2xl font-bold">MBTI Traits</h2>
            </div>
            {assessment.mbtiTraits.map((trait) => (
              <div
                key={trait.trait}
                className="mx-20 mt-3 rounded-xl bg-[#FFBEB9] p-3 text-lg text-[#755B5B]"
              >
                <h3 className="text-center text-xl font-bold">{trait.trait}</h3>
                <p>{trait.explanation}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
};
