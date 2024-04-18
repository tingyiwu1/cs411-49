import React from "react";
import "./Home.css"; // Import CSS file for styling
import { Link } from "react-router-dom";
import { useLogin } from "../../hooks";

const HomePage: React.FC = () => {
  const { loggedIn, user } = useLogin();

  return (
    <div className="home-container">
      {/* Header */}
      <div className="header">
        <div className="left-section">
          <div className="logo">Logo</div>
          <div className="title">MoodTune</div>
        </div>
        <div className="right-section">
          {loggedIn || <Link to="/login">Login</Link>}
          {user && (
            <>
              <div className="profile-name">{user.display_name}</div>
            </>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Large Rectangle */}
        <div className="large-rectangle">
          <div className="left-section">
            <h2>Share your playlist!</h2>
            <img
              src="path_to_your_image.jpg"
              alt="Small Image"
              className="small-image"
            />
            <p>Connect to your Spotify account or upload your playlist</p>
          </div>
          <div className="right-section">
            <h2>What's your mood?</h2>
            <p>Some prompts/text to conclude your mood</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
