import React, { useState, useEffect } from "react";
import "./Home.css";
import axios from "axios";
import { Link } from "react-router-dom";
import { useLogin } from "../../hooks";

const HomePage: React.FC = () => {
  const { loggedIn, user } = useLogin();
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user's playlists from the backend
        const response = await axios.get("/evaluate");
        // Check if the response contains playlists
        if (response.data && Array.isArray(response.data.playlists)) {
          // Set playlist names in state
          setPlaylists(response.data.playlists);
        } else {
          console.error("Invalid playlists data:", response.data);
        }
      } catch (error) {
        console.error("Error fetching playlists:", error);
      }
    };
  
    if (loggedIn) {
      fetchData();
    }
  }, [loggedIn]);
  

  const handleCheckboxChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
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
    console.log(selectedOptions);
    // Send selected options to backend for analysis
    try {
      const response = await axios.post("/evaluate", {
        options: selectedOptions,
      });
      console.log(response.data);
      // Handle response from backend (which will contain the MBTI type)
      // Display the MBTI type to the user or take further actions based on it
    } catch (error) {
      console.error("Error analyzing data:", error);
      // Handle error
    }
  }; 

  return (
    <>
      {/* Header */}
      <div className="header">
        <div className="left-section">
          <div className="logo">Logo</div>
          <div className="title">SoundSoul</div>
        </div>
        <div className="right-section">
          {loggedIn || <Link to="/login">Login</Link>}
          {user && <div className="profile-name">{user.display_name}</div>}
        </div>
      </div>
  
      {/* Main Content */}
      <div className="content-container">
        <div className="home-container">
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
              {/* Render checkboxes for user's playlists */}
              {playlists.map((playlist) => (
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
        </div>
      </div>
    </>
  );  
};

export default HomePage;