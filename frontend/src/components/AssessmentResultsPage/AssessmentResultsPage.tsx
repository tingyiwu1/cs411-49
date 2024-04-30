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

  // Define inline CSS styles for padding
  const containerStyle: React.CSSProperties = {
    padding: '20px', // Adjust the padding size as needed
    borderRadius: '8px', // Optional: Add border radius
  };

  return (
    <div style={containerStyle}>
      <h1>Assessment Results</h1>
      {assessment ? (
        <div>
          <div>
            <p>{assessment.personality}</p>
          </div>
          {assessment.categories.playlists && (
            <div>
              <h2>Playlists</h2>
              <p>{assessment.categories.playlists}</p>
            </div>
          )}
          {assessment.categories.topArtists && (
            <div>
              <h2>Artists</h2>
              <p>{assessment.categories.topArtists}</p>
            </div>
          )}
          {assessment.categories.topTracks && (
            <div>
              <h2>Tracks</h2>
              <p>{assessment.categories.topTracks}</p>
            </div>
          )}
          {assessment.categories.savedAlbums && (
            <div>
              <h2>Albums</h2>
              <p>{assessment.categories.savedAlbums}</p>
            </div>
          )}
          {assessment.categories.recentlyPlayed && (
            <div>
              <h2>Recently Played</h2>
              <p>{assessment.categories.recentlyPlayed}</p>
            </div>
          )}
          <div>
            <h2>MBTI Traits</h2>
            {assessment.mbtiTraits.map((trait) => (
              <div key={trait.trait}>
                <p>{trait.trait}</p>
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
