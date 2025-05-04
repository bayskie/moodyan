import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, Label } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaPen, FaTrashAlt  } from "react-icons/fa";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import '../Home/Home.css';
import Swal from 'sweetalert2'; // Import SweetAlert2

// Import all mood images directly for better path management
import HappyImg from '../images/happy.png';
import SadImg from '../images/sad.png';
import AngryImg from '../images/angry.png';
import AnxiousImg from '../images/anxious.png';
import ExhaustedImg from '../images/exhausted.png';
import NeutralImg from '../images/neutral.png';
import HappySound from '../music/happy.mp3';
import AngrySound from '../music/angry.opus';

// Use imported assets in a centralized object
const MOOD_ASSETS = {
  happy: {
    imgSrc: HappyImg,
    alt: 'Happy',
    color: '#FFD25B',
    soundSrc: HappySound
  },
  sad: {
    imgSrc: SadImg,
    alt: 'Sad',
    color: '#52CBEC',
    soundSrc: null
  },
  angry: {
    imgSrc: AngryImg,
    alt: 'Angry',
    color: '#CA4B45',
    soundSrc: AngrySound
  },
  anxious: {
    imgSrc: AnxiousImg,
    alt: 'Anxious',
    color: '#9C72D9',
    soundSrc: null
  },
  exhausted: {
    imgSrc: ExhaustedImg,
    alt: 'Exhausted',
    color: '#92A75C',
    soundSrc: null
  },
  neutral: {
    imgSrc: NeutralImg,
    alt: 'Neutral',
    color: '#DCE8F4',
    soundSrc: null
  }
};

// Custom hook for audio management
const useAudio = () => {
  const audioRefs = useRef({});
  
  useEffect(() => {
    // Load audio for moods that have sound
    Object.entries(MOOD_ASSETS).forEach(([mood, { soundSrc }]) => {
      if (soundSrc) {
        audioRefs.current[mood] = new Audio(soundSrc);
      }
    });
    
    // Cleanup function
    return () => {
      Object.values(audioRefs.current).forEach(audio => {
        if (audio) {
          audio.pause();
          audio.currentTime = 0;
        }
      });
    };
  }, []);
  
  const playSound = (mood) => {
    const audio = audioRefs.current[mood];
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(error => {
        console.error("Error playing sound:", error);
        alert("Sound can only be played after user interaction. Click 'OK' then try again.");
      });
    }
  };
  
  return { playSound };
};

// Reusable MoodButton component
const MoodButton = ({ mood, isActive, onClick }) => {
  const { imgSrc, alt } = MOOD_ASSETS[mood];
  
  return (
    <button
      className={`mood-btn ${isActive ? 'active' : ''}`}
      onClick={onClick}
    >
      <img src={imgSrc} alt={alt} className="mood-filter" style={{ width: '50px', height: '50px' }} />
    </button>
  );
};

// Reusable MoodStatItem component
const MoodStatItem = ({ name, value }) => {
  const moodKey = name.toLowerCase();
  const { imgSrc, alt } = MOOD_ASSETS[moodKey] || MOOD_ASSETS.neutral;
  
  return (
    <div className="mood-stat-item text-center me-3">
      <img 
        className="p-2" 
        src={imgSrc} 
        alt={alt} 
        style={{ 
          width: name === 'Happy' ? '50px' : '40px', 
          height: name === 'Happy' ? '50px' : '40px' 
        }}
      />
      <h6 className="title-statistik text-center">
        {value}x
      </h6>
    </div>
  );
};

// Reusable PieChartComponent
const MoodPieChart = ({ tasks, totalTasks, labelText }) => {
  return (
    <PieChart width={250} height={250}>
      <Tooltip />
      <Pie
        data={tasks}
        nameKey="name"
        dataKey="value"
        innerRadius="60%"
        outerRadius="80%"
        startAngle={90}
        endAngle={-270}
        fill="#8884d8"
      >
        {tasks.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={entry.color || MOOD_ASSETS[entry.name.toLowerCase()]?.color || '#ccc'} />
        ))}
        <Label
          position="center"
          content={({ viewBox }) => {
            const { cx, cy } = viewBox;
            return (
              <g>
                <text 
                  x={cx} 
                  y={cy} 
                  textAnchor="middle" 
                  dominantBaseline="middle"
                  fontSize="24"
                  fontWeight="bold"
                >
                  {totalTasks}
                </text>
                <text 
                  x={cx} 
                  y={cy + 20} 
                  textAnchor="middle" 
                  dominantBaseline="middle"
                  fontSize="16"
                >
                  {labelText}
                </text>
              </g>
            );
          }}
        />
      </Pie>
    </PieChart>
  );
};

function Home() {
  const [nickname, setNickname] = useState("");
  const [selected, setSelected] = useState(""); 
  const [selectedMood, setSelectedMood] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [journalEntries, setJournalEntries] = useState([]);
  const navigate = useNavigate();
  const { playSound } = useAudio();
  
  // SAVE NICKNAME USER TO LOCALSTORAGE
  useEffect(() => {
    const storedNickname = localStorage.getItem("nickname");
    if (storedNickname) {
      setNickname(storedNickname);
    }

    // LOAD JOURNAL ENTRIES FROM LOCALSTORAGE
    const loadJournalEntries = () => {
      const storedEntries = localStorage.getItem("journalEntries");
      if (storedEntries) {
        const parsedEntries = JSON.parse(storedEntries);
        
        // Convert string dates back to Date objects
        const entriesWithDateObj = parsedEntries.map(entry => ({
          ...entry,
          dateObj: new Date(entry.dateObj)
        }));
        
        setJournalEntries(entriesWithDateObj);
      }
    };

    loadJournalEntries();
  }, []);

  // HANDLE MOOD FILTER
  const handleMoodFilter = (mood) => {
    playSound(mood);
    setSelectedMood((prev) => (prev === mood ? null : mood));
  };
  
  // FILTER BY CALENDAR
  const dateToMoodMap = useMemo(() => {
    const map = new Map();
    
    journalEntries.forEach(entry => {
      if (entry.dateObj instanceof Date) {
        const dateKey = `${entry.dateObj.getFullYear()}-${entry.dateObj.getMonth()}-${entry.dateObj.getDate()}`;
        if (!map.has(dateKey)) {
          // Create a new Set for unique moods on this date
          map.set(dateKey, new Set([entry.mood]));
        } else {
          // Add this mood to the existing Set for this date
          map.get(dateKey).add(entry.mood);
        }
      }
    });
    
    return map;
  }, [journalEntries]);

  // RENDER DAY CONTENT
  const renderDayContent = useCallback((day) => {
    const dateKey = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`;
    const moodsSet = dateToMoodMap.get(dateKey);
    if (moodsSet) {
      return <div>{Array.from(moodsSet).join(', ')}</div>;
    }
    return day.getDate();
  }, [dateToMoodMap]); 

  // CLEAR DATE
  const clearDateSelection = () => {
    setSelected(null);
  };

  // Calculate statistics from actual journal entries
  const moodCounts = useMemo(() => {
    const counts = {
      happy: 0,
      sad: 0,
      angry: 0,
      anxious: 0,
      exhausted: 0,
      neutral: 0
    };
    
    journalEntries.forEach(entry => {
      if (entry.mood && counts[entry.mood] !== undefined) {
        counts[entry.mood]++;
      }
    });
    
    return counts;
  }, [journalEntries]);

  // STATISTIC DATA - derived from actual journal entries
  const tasks = useMemo(() => {
    return [
      { name: 'Happy', value: moodCounts.happy || 0 },
      { name: 'Exhausted', value: moodCounts.exhausted || 0 },
      { name: 'Angry', value: moodCounts.angry || 0 },
      { name: 'Sad', value: moodCounts.sad || 0 },
      { name: 'Neutral', value: moodCounts.neutral || 0 },
      { name: 'Anxious', value: moodCounts.anxious || 0 },
    ];
  }, [moodCounts]);

  const totalTasks = useMemo(() => {
    return tasks.reduce((sum, task) => sum + task.value, 0);
  }, [tasks]);
  
  // Find the dominant mood (highest value)
  const dominantMood = useMemo(() => {
    return tasks.reduce((max, task) => task.value > max.value ? task : max, tasks[0]);
  }, [tasks]);
  
  // Consistent label
  const tasksNameLabel = "Journal";

  // Generate mood message based on dominant mood
  const getMoodMessage = (mood) => {
    if (mood.name === 'Happy') {
      return "That means you had more positive days than negative ones. Keep it up and continue nurturing your positive energy!";
    } else {
      return `You've been feeling ${mood.name.toLowerCase()} quite often. Consider activities that might help improve your mood.`;
    }
  };

  // CARD JOURNAL
  const moodEmojis = {
      happy: <img src={HappyImg} alt="Happy" className='mood-emojis' />,
      sad: <img src={SadImg} alt="Sad" className='mood-emojis' />,
      angry: <img src={AngryImg} alt="Angry" className='mood-emojis' />,
      anxious: <img src={AnxiousImg} alt="Anxious" className='mood-emojis' />,
      exhausted: <img src={ExhaustedImg} alt="Exhausted" className='mood-emojis' />,
      neutral: <img src={NeutralImg} alt="Neutral" className='mood-emojis' />,
    };
  
    const filteredJournals = useMemo(() => {
      return journalEntries.filter(entry => {
        const matchesSearch = entry.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            entry.content.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesDate = selected ? 
          (entry.dateObj instanceof Date && 
            entry.dateObj.getDate() === selected.getDate() && 
            entry.dateObj.getMonth() === selected.getMonth() && 
            entry.dateObj.getFullYear() === selected.getFullYear()) : true;
        
        const matchesMood = selectedMood ? entry.mood === selectedMood : true;
        return matchesSearch && matchesDate && matchesMood;
      });
    }, [journalEntries, searchQuery, selected, selectedMood]);
  
    const clearAllFilters = () => {
      setSelected(null);
      setSelectedMood(null);
      setSearchQuery('');
    };
  
    const handleAddJournal = () => {
      navigate('/add-journal');
    };

    // MODIFIED: Edit journal function to store entry to edit in localStorage 
    const handleEditJournal = (id) => {
      const journalToEdit = journalEntries.find(entry => entry.id === id);
      if (journalToEdit) {
        // Store the journal entry to edit in localStorage
        localStorage.setItem('journalToEdit', JSON.stringify(journalToEdit));
        // Navigate to the AddJournal component
        navigate('/add-journal');
      }
    };

    // MODIFIED: Delete journal with SweetAlert2
    const handleDeleteJournal = (id) => {
      Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, delete it!'
      }).then((result) => {
        if (result.isConfirmed) {
          // Remove from state
          const updatedEntries = journalEntries.filter(entry => entry.id !== id);
          setJournalEntries(updatedEntries);
          
          // Update localStorage
          localStorage.setItem('journalEntries', JSON.stringify(updatedEntries));
          
          Swal.fire(
            'Deleted!',
            'Your journal has been deleted.',
            'success'
          );
        }
      });
    };

  return (
    <div className="app">
      {/* SIDEBAR */}
      <div className="sidebar">
        <h4 className='font-caveat'>Hi there, {nickname}!</h4>
        <hr />
        
        {/* FILTER CALENDAR */}
        <div className="filter-section">
          <h5 className='mt-2'><b>Filter by Calendar</b></h5>
          <DayPicker
            className="custom-calendar"
            mode="single"
            selected={selected}
            onSelect={setSelected}
            showOutsideDays
            modifiersClassNames={{
              selected: 'my-selected',
              today: 'my-today'
            }}
            modifiers={{
              hasEntries: (date) => {
                const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
                return dateToMoodMap.has(dateKey);
              }
            }}
            components={{
              DayContent: ({ date }) => renderDayContent(date)
            }}
            footer={
              selected ? (
                <div>
                  Selected: {selected.toLocaleDateString()}
                  <button 
                    onClick={clearDateSelection}
                    className="date-clear-btn"
                  >
                    Clear
                  </button>
                </div>
              ) : "Pick a day."
            }
          />
        </div>
        
        {/* FILTER BY EMOT */}
        <div className="filter-section" style={{ marginTop:"-60px" }}>
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-2"><b>Filter by Emot</b></h5>
            {selectedMood && (
              <button onClick={() => setSelectedMood(null)} className="clear-filter-btn">
                Clear
              </button>
            )}
          </div>
          
          <div className="mood-buttons">
            {Object.keys(MOOD_ASSETS).map((mood) => (
              <MoodButton 
                key={mood}
                mood={mood}
                isActive={selectedMood === mood}
                onClick={() => handleMoodFilter(mood)}
              />
            ))}
          </div>
          
          {selectedMood && (
            <div className="selected-mood-info pt-2">
              <p><b>Journal about {selectedMood}</b></p>
            </div>
          )}
        </div>
        
        <div className="logo-section">
          <h4 className='font-caveat'>Moodyan</h4>
        </div>
      </div>

      {/* STATISTIC */}
      <div className='row mood-journey'>
        <div className="col-lg-4 d-flex justify-content-center align-items-center">
          <div className="dominant-mood-center">
            <MoodPieChart 
              tasks={tasks} 
              totalTasks={totalTasks}
              labelText={tasksNameLabel}
            />
          </div>
        </div>

        {/* Mood Icons Section */}
        <div className="col-lg-6 mx-3 my-5">
          <div className='d-flex flex-wrap'>
            {tasks.map((mood, index) => (
              <MoodStatItem 
                key={index} 
                name={mood.name} 
                value={mood.value} 
              />
            ))}
          </div>
          
          <div>
            <h1 className='title-statistik'>
              {totalTasks > 0 ? (
                <>You felt <span>{dominantMood.name.toLowerCase()}</span> {dominantMood.value} times!</>
              ) : (
                <>No journal entries yet</>
              )}
            </h1>
            {totalTasks > 0 && <p>{getMoodMessage(dominantMood)}</p>}
          </div>
        </div>
      </div>
      
      <div className="quote-section"></div>

      {/* CARD JOURNAL */}
      <div className="journal-section">
      <h5 className='mt-4 mb-3 position-relative w-100'>
  <b>Journal Entries   </b> 
  {(selected || selectedMood) && (
    <span className=''>
      {/* <small className='me-2'>
        (Filtered by:
        {selected && ` Date: ${selected.toLocaleDateString()}`}
        {selected && selectedMood && ', '}
        {selectedMood && ` Mood: ${selectedMood}`})
      </small> */}
      <button 
        onClick={clearAllFilters}
        className='btn btn-success btn-sm'
      >
        Show All
      </button>
    </span>
  )}
</h5>
              
              <div className="search-filter">
                <div className="search-bar">
                  <FaSearch style={{ marginLeft:"30px" }}/>
                  <input 
                    type="text" 
                    placeholder="Search through your journey" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
      
              <div className="journal-entries">
                <div
                  className="journal-card align-items-center justify-content-center d-flex"
                  onClick={handleAddJournal}
                >
                  <div className="plus-icon">+</div>
                  <p><b>New Journal</b></p>
                </div>
                
                {filteredJournals.length > 0 ? (
                  filteredJournals.map(entry => (
                    <div className={`journal-card ${entry.mood}`} key={entry.id}>
                      <div className='d-flex'>
                        <div>
                          <h3><b>{entry.title}</b></h3>
                          <p className="journal-date">{entry.date}</p>
                        </div>
                        <div className="mood-indicator">
                          <span className="mood-emoji">{moodEmojis[entry.mood]}</span>
                        </div>
                      </div>
                      <p className="journal-content">{entry.content.length > 100 ? entry.content.substring(0, 100) + '...' : entry.content}</p>
                      <div className="journal-actions">
                        <button 
                          className='btn-card'
                          onClick={() => handleEditJournal(entry.id)}
                        >
                          <FaPen size={14} />
                          <span> Edit</span>
                        </button>
                        
                        <button 
                          className='btn-card'
                          onClick={() => handleDeleteJournal(entry.id)}
                        >
                          <FaTrashAlt size={14} />
                          <span> Delete</span>
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-entries">
                    No journal entries found 
                    {selected && ` for ${selected.toLocaleDateString()}`}
                    {selectedMood && ` with mood: ${selectedMood}`}
                  </div>
                )}
              </div>
            </div>
    </div>
  );
}

export default Home;