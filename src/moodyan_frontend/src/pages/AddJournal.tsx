import { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import CardHappy from "../assets/images/CardHappy.png";
import CardSad from "../assets/images/CardSad.png";
import CardAngry from "../assets/images/CardAngry.png";
import CardAnxious from "../assets/images/CardAnxious.png";
import CardExhausted from "../assets/images/CardExhausted.png";
import CardNeutral from "../assets/images/CardNeutral.png";
import "../assets/styles/add-journal.css";

export default function AddJournal() {
  const [journalTitle, setJournalTitle] = useState("Untitled Journal");
  const [journalContent, setJournalContent] = useState("");
  const [lastSaved, setLastSaved] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [aiReflection, setAiReflection] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [mood, setMood] = useState(null);
  const [isEditing, setIsEditing] = useState(true);
  const [journalId, setJournalId] = useState(null);

  const navigate = useNavigate();

  // Load journal data when component mounts
  useEffect(() => {
    const journalToEdit = localStorage.getItem("journalToEdit");

    if (journalToEdit) {
      const parsedJournal = JSON.parse(journalToEdit);

      // Populate form with existing journal data
      setJournalId(parsedJournal.id);
      setJournalTitle(parsedJournal.title);
      setJournalContent(parsedJournal.content);
      setMood(parsedJournal.mood);
      setAiReflection(parsedJournal.reflection);
      setIsSaved(true);

      // If there's a date, convert it to a Date object
      if (parsedJournal.dateObj) {
        setLastSaved(new Date(parsedJournal.dateObj));
      }

      // Clear the localStorage item after loading
      localStorage.removeItem("journalToEdit");
    }
  }, []);

  const formatDate = (date) => {
    if (!date) return "";
    return date.toLocaleString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  // Function to analyze mood based on journal content
  const analyzeJournalMood = (content) => {
    const contentLower = content.toLowerCase();

    // Simple sentiment analysis (could be replaced with more advanced AI)
    const happyWords = [
      "happy",
      "joy",
      "excited",
      "wonderful",
      "great",
      "amazing",
      "love",
      "proud",
    ];
    const sadWords = [
      "sad",
      "unhappy",
      "depressed",
      "miserable",
      "cry",
      "tears",
      "heartbroken",
    ];
    const angryWords = [
      "angry",
      "mad",
      "furious",
      "rage",
      "upset",
      "frustrated",
      "annoyed",
    ];
    const anxiousWords = [
      "anxious",
      "worried",
      "nervous",
      "stress",
      "fear",
      "dread",
      "panic",
    ];
    const exhaustedWords = [
      "tired",
      "exhausted",
      "drained",
      "fatigue",
      "weary",
      "sleepy",
    ];

    // Count occurrences of each mood type
    let happyCount = happyWords.filter((word) =>
      contentLower.includes(word)
    ).length;
    let sadCount = sadWords.filter((word) =>
      contentLower.includes(word)
    ).length;
    let angryCount = angryWords.filter((word) =>
      contentLower.includes(word)
    ).length;
    let anxiousCount = anxiousWords.filter((word) =>
      contentLower.includes(word)
    ).length;
    let exhaustedCount = exhaustedWords.filter((word) =>
      contentLower.includes(word)
    ).length;

    // Determine dominant mood
    const moodCounts = [
      { mood: "happy", count: happyCount },
      { mood: "sad", count: sadCount },
      { mood: "angry", count: angryCount },
      { mood: "anxious", count: anxiousCount },
      { mood: "exhausted", count: exhaustedCount },
    ];

    // Sort by count (highest first)
    moodCounts.sort((a, b) => b.count - a.count);

    // Return the most frequent mood, or Neutral if no mood is detected
    return moodCounts[0].count > 0 ? moodCounts[0].mood : "neutral";
  };

  // Generate reflection based on mood
  const generateReflection = (detectedMood) => {
    const reflections = {
      happy:
        "Your journal radiates positivity and joy! I can feel your happiness through your words. This is a wonderful moment to cherish and remember during challenging times. Keep embracing these positive feelings!",
      sad: "I sense some sadness in your writing. Remember that it's okay to feel this way sometimes. These emotions are valid and important. Consider what might bring you comfort right now, and be gentle with yourself.",
      angry:
        "I notice feelings of frustration and anger in your journal. These are normal emotions that deserve acknowledgment. Try to identify what triggered these feelings and consider constructive ways to address the situation.",
      anxious:
        "Your journal suggests you might be feeling anxious or worried. Remember to take deep breaths and focus on what's within your control. Consider writing down specific concerns and potential solutions.",
      exhausted:
        "I can tell you're feeling tired and drained. Your body and mind might be signaling that you need rest. Consider taking some time for self-care and recovery. Small breaks can make a big difference.",
      neutral:
        "Your journal has a balanced tone today. This could be a good time for reflection and planning. Consider what areas of your life feel satisfying and which ones might need more attention.",
    };

    return reflections[detectedMood];
  };

  const handleSaveJournal = () => {
    setIsAnalyzing(true);

    // Simulate AI analysis with timeout
    setTimeout(() => {
      const detectedMood = analyzeJournalMood(journalContent);
      setMood(detectedMood);
      setAiReflection(generateReflection(detectedMood));

      const currentDate = new Date();
      setLastSaved(currentDate);

      // Get existing entries from localStorage or initialize empty array
      const existingEntries = JSON.parse(
        localStorage.getItem("journalEntries") || "[]"
      );

      let updatedEntries;

      if (journalId) {
        // If we have a journal ID, we're editing an existing entry
        updatedEntries = existingEntries.map((entry) => {
          if (entry.id === journalId) {
            // Update the existing entry
            return {
              ...entry,
              title: journalTitle,
              date: formatDate(currentDate),
              dateObj: currentDate,
              content: journalContent,
              mood: detectedMood,
              reflection: generateReflection(detectedMood),
            };
          }
          return entry;
        });
      } else {
        // Create a new journal entry
        const newJournal = {
          id: Date.now(), // Generate unique ID based on timestamp
          title: journalTitle,
          date: formatDate(currentDate),
          dateObj: currentDate,
          content: journalContent,
          mood: detectedMood,
          reflection: generateReflection(detectedMood),
        };

        // Add new entry to the beginning of the array
        updatedEntries = [newJournal, ...existingEntries];
      }

      // Save updated array back to localStorage
      localStorage.setItem("journalEntries", JSON.stringify(updatedEntries));

      setIsAnalyzing(false);
      setIsSaved(true);
      setIsEditing(false);
    }, 1500);
  };

  const handleEditJournal = () => {
    setIsEditing(true);
  };

  const handleDeleteJournal = () => {
    Swal.fire({
      title: "Are you sure?",
      text: "You want to delete this journal?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#92A75C",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        // If we have a journal ID, remove it from localStorage
        if (journalId) {
          const existingEntries = JSON.parse(
            localStorage.getItem("journalEntries") || "[]"
          );
          const updatedEntries = existingEntries.filter(
            (entry) => entry.id !== journalId
          );
          localStorage.setItem(
            "journalEntries",
            JSON.stringify(updatedEntries)
          );
        }

        // Show success message
        Swal.fire({
          title: "Deleted!",
          text: "Your journal has been deleted.",
          icon: "success",
          confirmButtonColor: "#92A75C",
          timer: 1500,
        });

        // Reset the form
        setJournalTitle("Untitled Journal");
        setJournalContent("");
        setAiReflection(null);
        setMood(null);
        setIsSaved(false);
        setIsEditing(true);
        setJournalId(null);

        // Navigate back to home
        navigate("/home");
      }
    });
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

  const getMoodCard = () => {
    const cards = {
      happy: CardHappy,
      sad: CardSad,
      angry: CardAngry,
      anxious: CardAnxious,
      exhausted: CardExhausted,
      neutral: CardNeutral,
    };

    return cards[mood] || null;
  };

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
                  className="form-control shadow-sm journal-content"
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
                {/* Mood Card Display */}
                {mood && (
                  <div className="mb-4">
                    <img
                      src={getMoodCard()}
                      alt={`${mood} Mood Card`}
                      className="img-fluid rounded shadow-sm mood-card"
                    />
                    <h5 className="mt-3 mb-4 text-center fw-bold">
                      Today's Mood: {mood}
                    </h5>
                  </div>
                )}

                {/* AI Reflection */}
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
