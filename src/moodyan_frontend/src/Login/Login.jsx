// LoginPage.js
import React, { useEffect, useState } from "react";
import { AuthClient } from "@dfinity/auth-client";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import Swal from "sweetalert2";
import './Login.css';

const LoginPage = () => {
  const navigate = useNavigate();
  const [nickname, setNickname] = useState("");
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Initialize checkAuthentication
  useEffect(() => {
    const checkAuthentication = async () => {
      const authClient = await AuthClient.create();
      if (await authClient.isAuthenticated()) {
        const storedNickname = localStorage.getItem("nickname");
        if (!storedNickname) {
          setIsFirstLogin(true);
          setShowModal(true);
        } else {
          navigate("/home");
        }
      }
    };

    checkAuthentication();
  }, [navigate]);

  const handleLogin = async () => {
    const authClient = await AuthClient.create();
    authClient.login({
      identityProvider: "https://identity.ic0.app",
      onSuccess: () => {
        const storedNickname = localStorage.getItem("nickname");
        if (!storedNickname) {
          setIsFirstLogin(true);
          setShowModal(true);
        } else {
          navigate("/home");
        }
      },
    });
  };

  const handleSetNickname = () => {
    if (!nickname.trim()) {
      Swal.fire({
        icon: "error",
        title: "Oops!",
        text: "Nama panggilan tidak boleh kosong.",
      });
      return;
    }
    
    localStorage.setItem("nickname", nickname);
    
    Swal.fire({
      icon: "success",
      title: "Berhasil!",
      text: `Halo ${nickname}! Selamat datang di Moodyan.`,
    }).then(() => {
      setShowModal(false);
      navigate("/home");
    });
  };

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100 login">
      <div className="container">
        <div className="row">
          <div className="col-md-6 col-lg-5 title">
            <h1 className="display-4 fw-bold text-dark mb-2">Moodyan</h1>
            <p className="fs-5 mb-5">
              From Mood Swings to Mindful Living —<br /> with AI by Your Side.
            </p>
            {!isFirstLogin && (
              <button
                className="btn btn-dark px-4 py-3 bg-dark text-white rounded-pill"
                onClick={handleLogin}
              >
                Enter with Internet Identity
              </button>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-dark bg-opacity-50">
          <div className="bg-white p-4 rounded shadow-lg" style={{ maxWidth: "400px" }}>
            <h2 className="fs-4 fw-bold mb-3">Hi! 😊</h2>
            <p className="fs-6 mb-3">
                Mention your favorite nickname.
            </p>
            <input
              type="text"
              className="form-control border rounded p-2 w-100 mb-3"
              placeholder="Masukkan nama panggilan"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />
            <div className="d-flex justify-content-end gap-2">
              <button
                className="btn btn-secondary"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-dark"
                onClick={handleSetNickname}
              >
                Save and Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;