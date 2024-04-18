import React, { useEffect } from "react";
import "./Login.css"; // Import CSS file for styling
import { Link, useNavigate, useSearchParams } from "react-router-dom";

const LoginPage = () => {
  const [params, setParams] = useSearchParams();

  const navigate = useNavigate();

  useEffect(() => {
    const jwt = params.get("jwt");
    if (jwt) {
      localStorage.setItem("jwt", jwt);
      navigate("/");
    }
  }, [params, setParams, navigate]);

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="image-container">
          <img src="path_to_your_image.jpg" alt="Logo" className="logo" />
        </div>
        <h2>MoodTune</h2>
        <div className="action-container">
          <Link className="login-button" to="http://localhost:3000/login">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
