// import { useState } from "react";
// import reactLogo from "./assets/react.svg";
// import viteLogo from "/vite.svg";
import axios from "axios";
// import "./App.css";
// import { HomePage } from "./components/HomePage/HomePage";
import HomePage from "./components/HomePage/HomePage2";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import LoginPage from "./components/LoginPage/LoginPage";
import { useEffect } from "react";
import { useLogin } from "./hooks";
import ChoicesPage from "./components/ChoicesPage/ChoicesPage";

function App() {
  if (process.env.NODE_ENV === "development") {
    axios.defaults.baseURL = "http://localhost:3000";
  } else {
    axios.defaults.baseURL = "http://localhost:3000";
  }
  const { loggedIn, user } = useLogin();
  useEffect(() => {
    if (loggedIn) {
      const getPlaylist = async () => {
        const response = await axios.get("/history");
        console.log(response.data);
      };
      void getPlaylist();
    }
  }, [loggedIn]);
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/choices" element={<ChoicesPage />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
