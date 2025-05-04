import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useNavigate } from 'react-router-dom';
import CardHappy from '../images/CardHappy.png';
import CardSad from '../images/CardSad.png';
import CardAngry from '../images/CardAngry.png';
import CardAnxious from '../images/CardAnxious.png';
import CardExhausted from '../images/CardExhausted.png';
import CardNeutral from '../images/CardNeutral.png';

const AddJournal = () => {
  const [journalTitle, setJournalTitle] = useState('Untitled Journal');
  const [journalContent, setJournalContent] = useState('');
  const [lastSaved, setLastSaved] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [aiReflection, setAiReflection] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [mood, setMood] = useState(null);
  const [isEditing, setIsEditing] = useState(true);
  const [journalId, setJournalId] = useState(null); // Add state for journal ID

  const navigate = useNavigate();

  // Load journal data when component mounts
  useEffect(() => {
    // Check if we're editing an existing journal
    const journalToEdit = localStorage.getItem('journalToEdit');
    
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
      localStorage.removeItem('journalToEdit');
    }
  }, []);

  const formatDate = (date) => {
    if (!date) return '';
    return date.toLocaleString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  // Function to analyze mood based on journal content
  const analyzeJournalMood = (content) => {
    const contentLower = content.toLowerCase();
    
    // Simple sentiment analysis (could be replaced with more advanced AI)
    const happyWords = ['happy', 'joy', 'excited', 'wonderful', 'great', 'amazing', 'love', 'proud'];
    const sadWords = ['sad', 'unhappy', 'depressed', 'miserable', 'cry', 'tears', 'heartbroken'];
    const angryWords = ['angry', 'mad', 'furious', 'rage', 'upset', 'frustrated', 'annoyed'];
    const anxiousWords = ['anxious', 'worried', 'nervous', 'stress', 'fear', 'dread', 'panic'];
    const exhaustedWords = ['tired', 'exhausted', 'drained', 'fatigue', 'weary', 'sleepy'];
    
    // Count occurrences of each mood type
    let happyCount = happyWords.filter(word => contentLower.includes(word)).length;
    let sadCount = sadWords.filter(word => contentLower.includes(word)).length;
    let angryCount = angryWords.filter(word => contentLower.includes(word)).length;
    let anxiousCount = anxiousWords.filter(word => contentLower.includes(word)).length;
    let exhaustedCount = exhaustedWords.filter(word => contentLower.includes(word)).length;
    
    // Determine dominant mood
    const moodCounts = [
      { mood: 'happy', count: happyCount },
      { mood: 'sad', count: sadCount },
      { mood: 'angry', count: angryCount },
      { mood: 'anxious', count: anxiousCount },
      { mood: 'exhausted', count: exhaustedCount }
    ];
    
    // Sort by count (highest first)
    moodCounts.sort((a, b) => b.count - a.count);
    
    // Return the most frequent mood, or Neutral if no mood is detected
    return moodCounts[0].count > 0 ? moodCounts[0].mood : 'neutral';
  };

  // Generate reflection based on mood
  const generateReflection = (detectedMood) => {
    const reflections = {
      happy: "Your journal radiates positivity and joy! I can feel your happiness through your words. This is a wonderful moment to cherish and remember during challenging times. Keep embracing these positive feelings!",
      sad: "I sense some sadness in your writing. Remember that it's okay to feel this way sometimes. These emotions are valid and important. Consider what might bring you comfort right now, and be gentle with yourself.",
      angry: "I notice feelings of frustration and anger in your journal. These are normal emotions that deserve acknowledgment. Try to identify what triggered these feelings and consider constructive ways to address the situation.",
      anxious: "Your journal suggests you might be feeling anxious or worried. Remember to take deep breaths and focus on what's within your control. Consider writing down specific concerns and potential solutions.",
      exhausted: "I can tell you're feeling tired and drained. Your body and mind might be signaling that you need rest. Consider taking some time for self-care and recovery. Small breaks can make a big difference.",
      neutral: "Your journal has a balanced tone today. This could be a good time for reflection and planning. Consider what areas of your life feel satisfying and which ones might need more attention."
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
      const existingEntries = JSON.parse(localStorage.getItem('journalEntries') || '[]');
      
      let updatedEntries;
      
      if (journalId) {
        // If we have a journal ID, we're editing an existing entry
        updatedEntries = existingEntries.map(entry => {
          if (entry.id === journalId) {
            // Update the existing entry
            return {
              ...entry,
              title: journalTitle,
              date: formatDate(currentDate),
              dateObj: currentDate,
              content: journalContent,
              mood: detectedMood,
              reflection: generateReflection(detectedMood)
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
          reflection: generateReflection(detectedMood)
        };
        
        // Add new entry to the beginning of the array
        updatedEntries = [newJournal, ...existingEntries];
      }
      
      // Save updated array back to localStorage
      localStorage.setItem('journalEntries', JSON.stringify(updatedEntries));
      
      setIsAnalyzing(false);
      setIsSaved(true);
      setIsEditing(false);
    }, 1500);
  };

  const handleEditJournal = () => {
    setIsEditing(true);
  };

  const handleDeleteJournal = () => {
    if (window.confirm('Are you sure you want to delete this journal?')) {
      // If we have a journal ID, remove it from localStorage
      if (journalId) {
        const existingEntries = JSON.parse(localStorage.getItem('journalEntries') || '[]');
        const updatedEntries = existingEntries.filter(entry => entry.id !== journalId);
        localStorage.setItem('journalEntries', JSON.stringify(updatedEntries));
      }
      
      // Reset the form
      setJournalTitle('Untitled Journal');
      setJournalContent('');
      setAiReflection(null);
      setMood(null);
      setIsSaved(false);
      setIsEditing(true);
      setJournalId(null);
      
      // Navigate back to home
      navigate('/home');
    }
  };

  const handleCancel = () => {
    if (isSaved) {
      navigate('/home');
    } else if (journalContent.trim().length > 0) {
      if (window.confirm('Return to Home? Unsaved changes will be lost.')) {
        navigate('/home');
      }
    } else {
      navigate('/home');
    }
  };

  const handleBackToHome = () => {
    navigate('/home');
  };

  const getMoodCard = () => {
    const cards = {
      happy: CardHappy,
      sad: CardSad,
      angry: CardAngry,
      anxious: CardAnxious,
      exhausted: CardExhausted,
      neutral: CardNeutral
    };
    
    return cards[mood] || null;
  };

  return (
    <div className="container-fluid p-0">
      <div className="row g-0">
        <div className="col-md-6 border-end" style={{ backgroundColor: '#f8f9fa' }}>
          <div className="p-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h4 className="fw-bold">
                {isEditing ? (journalId ? 'Edit Journal' : 'Add Journal') : 'Journal Entry'}
                {lastSaved && (
                  <small className="text-muted fs-6 d-block">
                    Last saved: {formatDate(lastSaved)}
                  </small>
                )}
              </h4>
              <div>
                {isEditing ? (
                  <>
                    <button 
                      className="btn btn-outline-secondary me-2" 
                      onClick={handleCancel}
                    >
                      Cancel
                    </button>
                    <button
                      className="btn"
                      style={{backgroundColor:"#92A75C", color:"#F9F5F4"}}
                      onClick={handleSaveJournal}
                      disabled={journalContent.trim().length === 0}
                    >
                      Save Journal
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      className="btn btn-outline-secondary me-2" 
                      onClick={handleBackToHome}
                    >
                      Back to Home
                    </button>
                    <button className="btn btn-outline-danger me-2" onClick={handleDeleteJournal}>
                      Delete
                    </button>
                    <button className="btn btn-primary" onClick={handleEditJournal}>
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
                  className="form-control shadow-sm"
                  style={{ minHeight: "400px", resize: "vertical" }}
                  value={journalContent}
                  onChange={(e) => setJournalContent(e.target.value)}
                  placeholder="Start writing here..."
                />
              </>
            ) : (
              <div className="bg-white p-4 rounded shadow-sm">
                <h3 className="mb-4">{journalTitle}</h3>
                <div style={{ whiteSpace: 'pre-wrap' }}>
                  {journalContent}
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="col-md-6" style={{ backgroundColor: '#f0f7ff' }}>
          <div className="p-4">
            <h4 className="text-center fw-bold mb-4">AI Reflection</h4>
            
            {isAnalyzing ? (
              <div className="text-center p-5">
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
                      className="img-fluid rounded shadow-sm" 
                      style={{ maxHeight: '250px' }}
                    />
                    <h5 className="mt-3 mb-4 text-center fw-bold">Today's Mood: {mood}</h5>
                  </div>
                )}
                
                {/* AI Reflection */}
                <div className="bg-white p-4 rounded shadow-sm text-start">
                  <h5 className="border-bottom pb-2 mb-3">Reflection</h5>
                  <p>{aiReflection}</p>
                </div>
              </div>
            ) : (
              <div className="text-center p-5 bg-white rounded shadow-sm">
                <p>Write your journal and save it to see the AI's reflection!</p>
                <p className="text-muted">Our AI will analyze your emotions and provide personalized insights.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddJournal;