// import { useState } from "react";
// import reactLogo from "./assets/react.svg";
// import viteLogo from "/vite.svg";
import axios from "axios";
import "./App.css";
// import { HomePage } from "./components/HomePage/HomePage";
import AssessmentPage from "./components/AssessmentPage/AssessmentPage";
import logo from "./components/sound-waves.png";

import {
  BrowserRouter,
  Link,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";
import LoginPage from "./components/LoginPage/LoginPage";
import { useLogin } from "./hooks";
import ChoicesPage from "./components/ChoicesPage/ChoicesPage";
import { HomePage } from "./components/HomePage/HomePage";
import { AssessmentsListPage } from "./components/AssessmentsListPage/AssessmentsListPage";
import { AssessmentResultsPage } from "./components/AssessmentResultsPage/AssessmentResultsPage";
import { useEffect, useState} from "react";

function App() {
  if (process.env.NODE_ENV === "development") {
    axios.defaults.baseURL = "http://localhost:3000";
  } else {
    axios.defaults.baseURL = "http://localhost:3000";
  }
  const { loggedIn, user, logOut } = useLogin();
  const [dropdownVisible, setDropdownVisible] = useState(false);

  // const navigate = useNavigate();

  // useEffect(() => {
  //   if (!loggedIn) {
  //     navigate("/");
  //   }
  // }, [loggedIn, navigate]);
  useEffect(() => {
    if (loggedIn) {
      const getPlaylist = async () => {
        const response = await axios.post("/mood", {
          start: "2024-04-24",
        });
        console.log(response.data);
      };
      void getPlaylist();
    }
  }, [loggedIn]);
  return (
    <>
      <BrowserRouter>
        <div className="header">
          <Link to="/" className="logo">
                <img src={logo} alt="Logo" className="logo-img" />
          </Link>
          {/* <div className="left-section">
            <Link to="/" className="logo">
                <img src={logo} alt="Logo" className="logo-img" />
            </Link>
          </div> */}
          <Link to="/" className="logo">
            <div className="title">SoundSoul</div>
          </Link>
          {user && (
            <div className="user-section">
              <div className="analyze-link">
                <Link to="/analyze">Analyze!</Link>
              </div>
              <div
              className="dropdown cursor-pointer"
              onMouseEnter={() => setDropdownVisible(true)}
              onMouseLeave={() => setDropdownVisible(false)}
            >
              {user && <div>{user.display_name}</div>}
              {/* Dropdown menu */}
              {dropdownVisible && (
                <div className="dropdown-menu">
                  <Link
                    to="/history"
                    className="block px-4 py-2 text-gray-800 hover:bg-gray-200"
                    onClick={() => setDropdownVisible(false)}
                  >
                    History
                  </Link>
                  <button
                    onClick={logOut}
                    className="block w-full px-4 py-2 text-left text-gray-800 hover:bg-gray-200"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
            </div>
            )}
        </div>

        <div className="h-20" />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/analyze"
            element={loggedIn ? <AssessmentPage /> : <Navigate to={"/"} />}
          />
          <Route
            path="/history"
            element={loggedIn ? <AssessmentsListPage /> : <Navigate to={"/"} />}
          />
          <Route
            path="/assessments/:id"
            element={
              loggedIn ? <AssessmentResultsPage /> : <Navigate to={"/"} />
            }
          />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;