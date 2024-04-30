// import { useState } from "react";
// import reactLogo from "./assets/react.svg";
// import viteLogo from "/vite.svg";
import axios from "axios";
import "./App.css";
// import { HomePage } from "./components/HomePage/HomePage";
import AssessmentPage from "./components/AssessmentPage/AssessmentPage";
import logo from "./components/logo-sm.svg";

import { Link, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import LoginPage from "./components/LoginPage/LoginPage";
import { LoginContext, UserData } from "./utils";
import { HomePage } from "./components/HomePage/HomePage";
import { ProfilePage } from "./components/ProfilePage/ProfilePage";
import { AssessmentResultsPage } from "./components/AssessmentResultsPage/AssessmentResultsPage";
import { useCallback, useEffect, useState } from "react";
import { NavBar } from "./components/NavBar";

function App() {
  if (process.env.NODE_ENV === "development") {
    axios.defaults.baseURL = "http://localhost:3000";
  } else {
    axios.defaults.baseURL = "http://localhost:3000";
  }
  const [user, setUser] = useState<UserData | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const jwt = localStorage.getItem("jwt");
    if (jwt) {
      axios.defaults.headers.common["Authorization"] = jwt;
      const getUser = async () => {
        const response = await axios.get("/me");
        setUser(response.data);
        setLoading(false);
      };
      void getUser();
    } else {
      setLoading(false);
    }
  }, []);

  const logOut = useCallback(() => {
    localStorage.removeItem("jwt");
    axios.defaults.headers.common["Authorization"] = null;
    setUser(null);
  }, []);
  const [dropdownVisible, setDropdownVisible] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user == null) {
      navigate("/");
    }
  }, [user, loading, navigate]);
  // useEffect(() => {
  //   if (loggedIn) {
  //     const getPlaylist = async () => {
  //       const response = await axios.post("/mood", {
  //         start: "2024-04-24",
  //       });
  //       console.log(response.data);
  //     };
  //     void getPlaylist();
  //   }
  // }, [loggedIn]);
  return (
    <LoginContext.Provider
      value={{
        loading,
        loggedIn: user !== null,
        logOut,
        user,
      }}
    >
      <div className="min-h-screen bg-[#F4F0E3]">
        <div className="hidden">
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
        <NavBar />
        <Routes>
          <Route
            path="/"
            element={user == null ? <HomePage /> : <Navigate to={"/analyze"} />}
          />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/analyze" element={<AssessmentPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/assessments/:id" element={<AssessmentResultsPage />} />
        </Routes>
      </div>
    </LoginContext.Provider>
  );
}

export default App;
