// import { useState } from "react";
// import reactLogo from "./assets/react.svg";
// import viteLogo from "/vite.svg";
import axios from "axios";
// import "./App.css";
// import { HomePage } from "./components/HomePage/HomePage";
import HomePage from "./components/HomePage/HomePage2";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import LoginPage from "./components/HomePage/LoginPage/LoginPage";

function App() {
  if (process.env.NODE_ENV === "development") {
    axios.defaults.baseURL = "http://localhost:3000";
  } else {
    axios.defaults.baseURL = "http://localhost:3000";
  }

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
