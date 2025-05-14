import { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { useNavigate, useLocation } from "react-router-dom";
import Swal from "sweetalert2";
import CardHappy from "../assets/images/CardHappy.png";
import CardSad from "../assets/images/CardSad.png";
import CardAngry from "../assets/images/CardAngry.png";
import CardAnxious from "../assets/images/CardAnxious.png";
import CardExhausted from "../assets/images/CardExhausted.png";
import CardNeutral from "../assets/images/CardNeutral.png";
import "../assets/styles/add-journal.css";
import { useAuth } from "../hooks/use-auth";

type Mood = "happy" | "sad" | "angry" | "anxious" | "exhausted" | "neutral" | null;

interface JournalToEdit {
  id: string;
  title: string;
  content: string;
  mood: string;
  date: string;
  dateObj: Date;
}

interface LocationState {
  journalToEdit?: JournalToEdit;
}

export default function AddJournal() {
  const { isAuthenticated, actor } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { journalToEdit } = (location.state as LocationState) || {};

  const [journalId, setJournalId] = useState<number | null>(null);
  const [journalTitle, setJournalTitle] = useState<string>("Untitled Journal");
  const [journalContent, setJournalContent] = useState<string>("");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [aiReflection, setAiReflection] = useState<string | null | undefined>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [mood, setMood] = useState<Mood>(null);
  const [isEditing, setIsEditing] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Inisialisasi data jurnal saat komponen dimuat
  useEffect(() => {
    if (journalToEdit) {
      console.log("Received journalToEdit:", journalToEdit); // Log untuk debugging
      setJournalId(Number(journalToEdit.id));
      setJournalTitle(journalToEdit.title || "Untitled Journal");
      setJournalContent(journalToEdit.content || "");
      setMood((journalToEdit.mood || "neutral") as Mood);
      // Pastikan dateObj valid, gunakan date sebagai fallback jika perlu
      setLastSaved(journalToEdit.dateObj ? new Date(journalToEdit.dateObj) : journalToEdit.date ? new Date(journalToEdit.date) : new Date());
      setIsSaved(true);
      setIsEditing(true); // Pastikan mode edit aktif
    } else {
      // Jika baru membuat jurnal, set tanggal saat ini
      setLastSaved(new Date());
    }
  }, [journalToEdit]);

  const handleSaveJournal = async () => {
    if (!actor) return;
    setIsAnalyzing(true);
    setError(null);

    try {
      let result;
      if (journalId) {
        result = await actor.updateJournalById(
          BigInt(journalId),
          journalTitle,
          journalContent
        );
      } else {
        result = await actor.createJournal(journalTitle, journalContent);
      }

      if ("ok" in result) {
        const savedJournal = result.ok;
        console.log("Saved Journal:", savedJournal); // Debug log
        setJournalId(Number(savedJournal.id));
        setLastSaved(new Date(Number(savedJournal.updatedAt) / 1_000_000));
        setIsSaved(true);
        setIsEditing(false);

        // Handle mood
        const moodValue: Mood = (savedJournal.mood && savedJournal.mood[0]) as Mood || "neutral";
        setMood(moodValue);

        // Handle reflection
        const reflectionValue: string | null | undefined = Array.isArray(savedJournal.reflection) && savedJournal.reflection.length > 0 ? savedJournal.reflection[0] : null;
        setAiReflection(reflectionValue);

        Swal.fire({
          title: "Success!",
          text: "Journal saved successfully",
          icon: "success",
          confirmButtonColor: "#92A75C",
        });
      } else {
        setError("Failed to save journal.");
        console.error(result.err);
      }
    } catch (error) {
      setError("Failed to save journal.");
      console.error(error);
    }

    setIsAnalyzing(false);
  };

  const handleDeleteJournal = async () => {
    if (!actor || !journalId) return;

    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This journal will be deleted permanently.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      try {
        const deleteResult = await actor.deleteJournalById(BigInt(journalId));
        if ("ok" in deleteResult) {
          Swal.fire({
            title: "Deleted!",
            text: "Your journal has been deleted.",
            icon: "success",
            confirmButtonColor: "#92A75C",
          });
          navigate("/home");
        } else {
          setError("Failed to delete journal.");
          console.error(deleteResult.err);
        }
      } catch (error) {
        setError("Failed to delete journal.");
        console.error(error);
      }
    }
  };

  const formatDate = (date: Date | null): string => {
    if (!date) return "";
    return date.toLocaleString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const handleEditJournal = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    if (isSaved) {
      navigate("/home");
    } else if (journalContent.trim().length > 0) {
      Swal.fire({
        title: "Unsaved Changes",
        text: "Return to Home? Unsaved changes will be lost.",
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#92A75C",
        cancelButtonColor: "#6c757d",
        confirmButtonText: "Yes, leave page",
        cancelButtonText: "Stay here",
      }).then((result) => {
        if (result.isConfirmed) {
          navigate("/home");
        }
      });
    } else {
      navigate("/home");
    }
  };

  const handleBackToHome = () => {
    navigate("/home");
  };

  const getMoodCard = (): string | null => {
    const cards: Record<NonNullable<Mood>, string> = {
      happy: CardHappy,
      sad: CardSad,
      angry: CardAngry,
      anxious: CardAnxious,
      exhausted: CardExhausted,
      neutral: CardNeutral,
    };

    return mood ? cards[mood] : null;
  };

  if (!isAuthenticated) {
    return (
      <div className="container-fluid p-0">
        <p>Please log in to access the journal.</p>
      </div>
    );
  }

  return (
    <div className="container-fluid p-0 journal-container">
      <div className="row g-0">
        {/* Journal Editor Column */}
        <div className="col-lg-6 journal-editor">
          <div className="p-3 p-md-4">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-3">
              <div className="journal-header">
                <h4 className="journal-title">
                  {isEditing
                    ? journalId
                      ? "Edit Journal"
                      : "Add Journal"
                    : "Journal Entry"}
                </h4>
                {lastSaved && (
                  <small className="journal-date">
                    Last saved: {formatDate(lastSaved)}
                  </small>
                )}
              </div>

              <div className="journal-buttons">
                {isEditing ? (
                  <>
                    <button
                      className="btn btn-outline-secondary"
                      onClick={handleCancel}
                    >
                      Cancel
                    </button>
                    <button
                      className="btn primary-button"
                      onClick={handleSaveJournal}
                      disabled={journalContent.trim().length === 0}
                    >
                      Save Journal
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="btn btn-outline-secondary"
                      onClick={handleBackToHome}
                    >
                      Back to Home
                    </button>
                    <button
                      className="btn btn-outline-danger"
                      onClick={handleDeleteJournal}
                    >
                      Delete
                    </button>
                    <button
                      className="btn btn-primary"
                      onClick={handleEditJournal}
                    >
                      Edit
                    </button>
                  </>
                )}
              </div>
            </div>

            {isEditing ? (
              <>
                <input
                  type="text"
                  className="form-control form-control-lg mb-3 shadow-sm"
                  value={journalTitle}
                  onChange={(e) => setJournalTitle(e.target.value)}
                  placeholder="Journal Title"
                />
                <textarea
                  className="form-control shadow-sm journal-content2"
                  value={journalContent}
                  onChange={(e) => setJournalContent(e.target.value)}
                  placeholder="Start writing here..."
                />
              </>
            ) : (
              <div className="journal-display">
                <h3 className="mb-4">{journalTitle}</h3>
                <div>{journalContent}</div>
              </div>
            )}

            {error && <p style={{ color: "red" }}>{error}</p>}
          </div>
        </div>

        {/* AI Reflection Column */}
        <div className="col-lg-6 journal-reflection">
          <div className="p-3 p-md-4">
            <h4 className="text-center fw-bold mb-4">AI Reflection</h4>

            {isAnalyzing ? (
              <div className="loading-container">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-3">Analyzing your journal...</p>
              </div>
            ) : aiReflection ? (
              <div className="text-center">
                {mood && (
                  <div className="mb-4">
                    <img
                      src={getMoodCard() ?? ""}
                      alt={`${mood} Mood Card`}
                      className="img-fluid rounded shadow-sm mood-card"
                    />
                    <h5 className="mt-3 mb-4 text-center fw-bold">
                      Today's Mood: {mood}
                    </h5>
                  </div>
                )}

                <div className="reflection-container">
                  <h5 className="reflection-title">Reflection</h5>
                  <p>{aiReflection}</p>
                </div>
              </div>
            ) : (
              <div className="empty-reflection">
                <p>
                  Write your journal and save it to see the AI's reflection!
                </p>
                <p className="text-muted">
                  Our AI will analyze your emotions and provide personalized
                  insights.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}