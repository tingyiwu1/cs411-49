import React, { useState, useEffect, useContext } from "react";
import "./AssessmentPage.css";
import axios from "axios";
import { useNavigate } from "react-router-dom"; // Import useNavigate instead of useHistory
import { Assessment } from "../../types";
import { LoginContext } from "../../utils";

const AssessmentPage: React.FC = () => {
  const { loggedIn } = useContext(LoginContext);
  const navigate = useNavigate(); // Access navigate function instead of useHistory
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  const [submitting, setSubmitting] = useState(false);

  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSelectedOptions((prevSelectedOptions) => {
      if (prevSelectedOptions.includes(value)) {
        return prevSelectedOptions.filter((option) => option !== value);
      } else {
        return [...prevSelectedOptions, value];
      }
    });
  };

  const handleSubmit = async () => {
    if (selectedOptions.length === 0) {
      return;
    }
    console.log(selectedOptions);
    setSubmitting(true);
    try {
      const response = await axios.post<Assessment>("/evaluate", {
        options: selectedOptions,
      });
      const assessment = response.data;
      navigate(`/assessments/${assessment.id}`);
    } catch (error) {
      console.error("Error analyzing data:", error);
    }
  };

  return (
    <>
      {/* Main Content */}
      <div className="content-container">
        <div className="home-container">
          {submitting ? (
            <div>Submitting...</div>
          ) : (
            <div className="main-content">
              <h2>Let's get analyzing!</h2>
              <p>What would you like to get analyzed?</p>
              <div className="checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    value="topArtists"
                    onChange={handleCheckboxChange}
                  />{" "}
                  Top Artists
                </label>
                {/* Render other checkboxes */}
                <label>
                  <input
                    type="checkbox"
                    value="topTracks"
                    onChange={handleCheckboxChange}
                  />{" "}
                  Top Tracks
                </label>
                <label>
                  <input
                    type="checkbox"
                    value="playlists"
                    onChange={handleCheckboxChange}
                  />{" "}
                  Playlists
                </label>
                <label>
                  <input
                    type="checkbox"
                    value="savedAlbums"
                    onChange={handleCheckboxChange}
                  />{" "}
                  Saved Albums
                </label>
                <label>
                  <input
                    type="checkbox"
                    value="recentlyPlayed"
                    onChange={handleCheckboxChange}
                  />{" "}
                  Recently Played
                </label>
              </div>
              <button onClick={handleSubmit}>Submit</button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AssessmentPage;
