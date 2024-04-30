import React from "react";
import { Link } from "react-router-dom";
import { useLogin } from "../../hooks";
import logo from "./../sound-waves.png";
import './Home.css'; // Assuming you have your CSS file imported here

export const HomePage: React.FC = () => {
  const { loggedIn } = useLogin();

  const handleBeginAnalyzing = () => {
    window.location.href = "/analyze";
  };

  const handleLogin = () => {
    window.location.href = "http://localhost:3000/login";
  };

  return (
    <div className="container">
      <div className="box">
        <div className="logo-container">
          <img src={logo} alt="Logo" className="logo" />
        </div>
        <h1>Welcome!</h1>
        <h2>
          Find your own personal rhythm
        </h2>
        <p>
          Use cutting-edge technology and AI to help you figure out what MBTI
          your music taste is.
        </p>
        {loggedIn ? (
          <Link to="/analyze">
            <button className="login-button">Begin Analyzing!</button>
          </Link>
        ) : (
          <button className="login-button" onClick={handleLogin}>Login</button>
        )}
      </div>
    </div>
  );
};
