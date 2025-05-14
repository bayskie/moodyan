import { useEffect, useState } from "react";
import { useAuth } from "../hooks/use-auth";
import { useNavigate } from "react-router-dom";
import "../assets/styles/welcome.css";
import "bootstrap/dist/css/bootstrap.min.css";

export default function Test() {
  const { isAuthenticated, principal, actor, login, logout } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [nickname, setNickname] = useState<string>("");
  const [showModal, setShowModal] = useState<boolean>(false);
  const navigate = useNavigate();

  const handleSaveNickname = async () => {
    if (!actor) return;
    if (!nickname) {
      setError("Nickname cannot be empty");
      return;
    }

    try {
      const result = await actor.saveNickname(nickname);
      if ("ok" in result) {
        setShowModal(false);
        setNickname("");
        navigate("/home");
      } else {
        setError(extractErrorMessage(result.err));
        console.error(result.err);
      }
    } catch (error) {
      setError("Failed to save nickname.");
      console.error(error);
    }
  };

  const checkNickname = async () => {
    if (!actor) return;
    try {
      const result = await actor.getNickname();
      if ("ok" in result && result.ok) {
        // If nickname exists, navigate to home
        navigate("/home");
      } else {
        // If no nickname, show modal
        setShowModal(true);
      }
    } catch (error) {
      setError("Failed to fetch nickname.");
      console.error(error);
      setShowModal(true); // Show modal on error to allow retry
    }
  };

  const extractErrorMessage = (err: any): string => {
    if ("InvalidInput" in err) {
      return err.InvalidInput;
    } else if ("NotFound" in err) {
      return err.NotFound;
    } else if ("Unauthorized" in err) {
      return "Unauthorized access";
    }
    return "Unknown error occurred";
  };

  useEffect(() => {
    if (isAuthenticated && actor) {
      checkNickname();
    }
  }, [isAuthenticated, actor]);

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100 login">
      <div className="container">
        <div className="row justify-content-center justify-content-md-start">
          <div className="col-12 col-md-10 col-lg-6 title-container text-center text-md-start">
            <h1 className="display-4 fw-bold YelpCamp mb-2">Moodyan</h1>
            <p className="fs-5 mb-4">
              From Mood Swings to Mindful Living — <br /> with AI by Your Side.
            </p>
            <div className="auth-section">
              {!isAuthenticated ? (
                <button
                  className="btn btn-dark px-3 py-2 px-md-4 py-md-3 bg-dark text-white rounded-pill mb-4"
                  onClick={login}
                >
                  Login with Internet Identity
                </button>
              ) : (
                <button
                  className="btn btn-dark px-3 py-2 px-md-4 py-md-3 bg-dark text-white rounded-pill mb-4"
                  onClick={logout}
                >
                  Logout
                </button>
              )}
            </div>

            {isAuthenticated && principal && (
              <div>
                <p>
                  Your Principal: <br /> <strong>{principal.toString()}</strong>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-dark bg-opacity-50 p-3">
          <div className="bg-white p-3 p-md-4 rounded shadow-lg modal-container">
            <h2 className="fs-4 fw-bold mb-3">Hi! 😊</h2>
            <p className="fs-6 mb-3">Mention your favorite nickname.</p>
            <input
              type="text"
              className="form-control border rounded p-2 w-100 mb-3"
              placeholder="Enter your nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />
            {error && <p style={{ color: "red" }}>{error}</p>}
            <div className="d-flex justify-content-end gap-2">
              <button
                className="btn btn-secondary"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button className="btn btn-dark" onClick={handleSaveNickname}>
                Save and Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}