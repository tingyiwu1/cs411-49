import React, { useState } from "react";
import "./AssessmentPage.css";
import axios from "axios";
import { useNavigate } from "react-router-dom"; // Import useNavigate instead of useHistory
import { Assessment } from "../../types";

const AssessmentPage: React.FC = () => {
  const navigate = useNavigate(); // Access navigate function instead of useHistory
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false); // Add state for submitting

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
    setSubmitting(true); // Set submitting to true
    console.log(selectedOptions);
    try {
      const response = await axios.post<Assessment>("/evaluate", {
        options: selectedOptions,
      });
      const assessment = response.data;
      navigate(`/assessments/${assessment.id}`);
    } catch (error) {
      console.error("Error analyzing data:", error);
    } finally {
      setSubmitting(false); // Reset submitting to false after analysis
    }
  };

  return (
    <>
      {/* Main Content */}
      <div className="main-content">
        <h2>Let's get analyzing!</h2>
        <p>What would you like to get analyzed?</p>
        <div className="checkbox-group">
          {/* Render checkboxes */}
          <label>
            <input
              type="checkbox"
              value="topArtists"
              onChange={handleCheckboxChange}
            />{" "}
            Top Artists
          </label>
          {/* Render other checkboxes */}
          {/* Display playlists checkboxes only if playlists are fetched */}
          {/* {playlists.map((playlist) => (
            <label key={playlist.name}>
              <input
                type="checkbox"
                value={playlist.name}
                onChange={handleCheckboxChange}
              />{" "}
              {playlist.name}
            </label>
          ))} 

          <label>
            Playlists: <br></br>
            <select multiple onChange={(event) => setSelectedOptions(Array.from(event.target.selectedOptions, (option) => option.value))}>
              {playlists.map((playlist) => (
                <option key={playlist.name} value={playlist.name}>
                  {playlist.name}
                </option>
              ))}
            </select>
          </label>*/}
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
              value="topTracks"
              onChange={handleCheckboxChange}
            />{" "}
            Top Tracks
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
        {/* Display loading message when submitting */}
        {submitting && (
          <div className="loading-message">
            <div className="loading-box">
              <p>Please wait, <br /> your music is currently being analyzed...</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default AssessmentPage;
