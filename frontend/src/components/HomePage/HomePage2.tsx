import React, { useState, useEffect } from "react";
import "./Home.css";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom"; // Import useNavigate instead of useHistory
import { useLogin } from "../../hooks";
import LogoImage from '../sound-waves.png';


const HomePage: React.FC = () => {
  const { loggedIn, user } = useLogin();
  const navigate = useNavigate(); // Access navigate function instead of useHistory
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get("/evaluate");
        if (response.data && Array.isArray(response.data.playlists)) {
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
    try {
      const response = await axios.post("/evaluate", {
        options: selectedOptions,
      });
      console.log(response.data);
      // Redirect to MessagePage after submitting
      navigate("../MessagePage/MessagePage");
    } catch (error) {
      console.error("Error analyzing data:", error);
    }
  };

  return (
    <>
      {/* Header */}
      <div className="header">
        <div className="left-section">
          {/* Logo */}
          <img src={LogoImage} alt="Logo" className="logo" />
        </div>
        <div className="title">SoundSoul</div>
        <div className="right-section">
          {/* Login button */}
          {loggedIn || <Link to="/login">Login</Link>}
          {/* User profile name */}
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