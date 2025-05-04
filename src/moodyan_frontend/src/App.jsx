import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import LoginPage from "./Login/Login";
import HomePage from "./Home/Home";
import AddJournal from "./AddJournal/AddJournal";


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/add-journal" element={<AddJournal />} />
      </Routes>
    </Router>
  );
}

export default App;
