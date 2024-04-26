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
    <div>
      <h1>Assessment Results</h1>
      {assessment ? (
        <div>
          <div>
            <p>{assessment.personality}</p>
          </div>
          {assessment.categories.playlists && (
            <div>
              <h2>Playlists</h2>
              {assessment.categories.playlists}
            </div>
          )}
          {assessment.categories.topArtists && (
            <div>
              <h2>Artists</h2>
              {assessment.categories.topArtists}
            </div>
          )}
          {assessment.categories.topTracks && (
            <div>
              <h2>Tracks</h2>
              {assessment.categories.topTracks}
            </div>
          )}
          {assessment.categories.savedAlbums && (
            <div>
              <h2>Albums</h2>
              {assessment.categories.savedAlbums}
            </div>
          )}
          <div>
            <h2>MBTI Traits</h2>
            {assessment.mbtiTraits.map((trait) => (
              <div key={trait.trait}>
                <h3>{trait.trait}</h3>
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
