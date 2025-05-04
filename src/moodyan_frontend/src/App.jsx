import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import LoginPage from "./Login/Login";
import HomePage from "./Home/Home";
import AddJournal from "./AddJournal/AddJournal";
import ProtectedRoute from "./components/ProtectedRoute";


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/add-journal"
          element={
            <ProtectedRoute>
              <AddJournal />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
