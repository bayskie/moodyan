import React, { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { PieChart, Pie, Cell, Tooltip } from "recharts";
import { useNavigate } from "react-router-dom";
import { FaSearch, FaPen, FaTrashAlt } from "react-icons/fa";
import Swal from "sweetalert2";
import "../assets/styles/home.css";
import { useAuth } from "../hooks/use-auth";

// Import mood assets
import HappyImg from "../assets/images/happy.png";
import SadImg from "../assets/images/sad.png";
import AngryImg from "../assets/images/angry.png";
import AnxiousImg from "../assets/images/anxious.png";
import ExhaustedImg from "../assets/images/exhausted.png";
import NeutralImg from "../assets/images/neutral.png";
import HappySound from "../assets/music/happy.mp3";
import SadSound from "../assets/music/sad.mp3";
import AngrySound from "../assets/music/angry.mp3";
import AnxiousSound from "../assets/music/anxious.mp3";
import ExhaustedSound from "../assets/music/exhausted.mp3";

// Interfaces
interface Journal {
  id: BigInt;
  title: string;
  content: string;
  mood: string[];
  createdAt: BigInt;
}

interface Actor {
  findAllJournals: (arg1: any[], arg2: any[]) => Promise<Journal[]>;
  getNickname: () => Promise<{ ok: string } | { err: any }>;
  deleteJournalById: (id: BigInt) => Promise<{ ok: any } | { err: any }>;
}

interface AuthContext {
  isAuthenticated: boolean;
  actor: Actor | null;
  logout: () => Promise<void>;
}

interface MoodAsset {
  imgSrc: string;
  alt: string;
  color: string;
  soundSrc: string | null;
}

interface JournalEntry {
  id: string;
  title: string;
  content: string;
  mood: string;
  date: string;
  dateObj: Date;
}

interface MoodCount {
  happy: number;
  sad: number;
  angry: number;
  anxious: number;
  exhausted: number;
  neutral: number;
}

interface PieChartData {
  name: string;
  value: number;
  color?: string;
}

// Mood assets configuration
const MOOD_ASSETS: Record<string, MoodAsset> = {
  happy: {
    imgSrc: HappyImg,
    alt: "Happy",
    color: "#FFD25B",
    soundSrc: HappySound,
  },
  sad: {
    imgSrc: SadImg,
    alt: "Sad",
    color: "#52CBEC",
    soundSrc: SadSound,
  },
  angry: {
    imgSrc: AngryImg,
    alt: "Angry",
    color: "#CA4B45",
    soundSrc: AngrySound,
  },
  anxious: {
    imgSrc: AnxiousImg,
    alt: "Anxious",
    color: "#9C72D9",
    soundSrc: AnxiousSound,
  },
  exhausted: {
    imgSrc: ExhaustedImg,
    alt: "Exhausted",
    color: "#92A75C",
    soundSrc: ExhaustedSound,
  },
  neutral: {
    imgSrc: NeutralImg,
    alt: "Neutral",
    color: "#DCE8F4",
    soundSrc: null,
  },
};

// Custom hook for audio management
const useAudio = () => {
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});

  useEffect(() => {
    Object.entries(MOOD_ASSETS).forEach(([mood, { soundSrc }]) => {
      if (soundSrc) {
        audioRefs.current[mood] = new Audio(soundSrc);
      }
    });

    return () => {
      Object.values(audioRefs.current).forEach((audio) => {
        audio.pause();
        audio.currentTime = 0;
      });
    };
  }, []);

  const playSound = useCallback((mood: string) => {
    const audio = audioRefs.current[mood];
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch((error: Error) => {
        console.error("Error playing sound:", error);
        alert(
          "Sound can only be played after user interaction. Click 'OK' then try again."
        );
      });
    }
  }, []);

  return { playSound };
};

// MoodButton component
interface MoodButtonProps {
  mood: string;
  isActive: boolean;
  onClick: () => void;
}

const MoodButton: React.FC<MoodButtonProps> = ({ mood, isActive, onClick }) => {
  const { imgSrc, alt } = MOOD_ASSETS[mood];

  return (
    <button
      className={`mood-btn ${isActive ? "active" : ""}`}
      onClick={onClick}
      type="button"
    >
      <img src={imgSrc} alt={alt} className="mood-filter" />
    </button>
  );
};

// MoodStatItem component
interface MoodStatItemProps {
  name: string;
  value: number;
}

const MoodStatItem: React.FC<MoodStatItemProps> = ({ name, value }) => {
  const moodKey = name.toLowerCase();
  const { imgSrc, alt } = MOOD_ASSETS[moodKey] || MOOD_ASSETS.neutral;

  return (
    <div className="mood-stat-item">
      <img src={imgSrc} alt={alt} className="mood-emojis" />
      <h6 className="title-statistik text-center">{value}x</h6>
    </div>
  );
};

// MoodPieChart component
interface MoodPieChartProps {
  tasks: PieChartData[];
  totalTasks: number;
  labelText: string;
}

const MoodPieChart: React.FC<MoodPieChartProps> = ({
  tasks,
  totalTasks,
  labelText,
}) => {
  return (
    <PieChart width={250} height={250}>
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
          <Cell
            key={`cell-${index}`}
            fill={
              entry.color ||
              MOOD_ASSETS[entry.name.toLowerCase()]?.color ||
              "#ccc"
            }
          />
        ))}
      </Pie>
      <Tooltip />
    </PieChart>
  );
};

const Home: React.FC = () => {
  const { isAuthenticated, actor, logout } = useAuth();
  const [displayNickname, setDisplayNickname] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Date | null>(null);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [sidebarActive, setSidebarActive] = useState<boolean>(false);
  const navigate = useNavigate();
  const { playSound } = useAudio();

  const getNickname = async () => {
    if (!actor) return;
    try {
      const result = await actor.getNickname();
      if ("ok" in result) {
        setDisplayNickname(result.ok);
      } else {
        setError(extractErrorMessage(result.err));
        console.error(result.err);
      }
    } catch (error) {
      setError("Failed to fetch nickname.");
      console.error(error);
    }
  };

const fetchJournals = async (): Promise<void> => {
  if (!actor) return;
  try {
    const result: Journal[] = await actor.findAllJournals([], []);
    const formattedEntries: JournalEntry[] = result.map((journal) => ({
      id: journal.id.toString(),
      title: journal.title,
      content: journal.content,
      mood: journal.mood && journal.mood.length > 0 ? journal.mood[0] : "neutral",
      date: new Date(Number(journal.createdAt) / 1_000_000).toLocaleDateString(), // Convert nanoseconds to milliseconds
      dateObj: new Date(Number(journal.createdAt) / 1_000_000), // Convert nanoseconds to milliseconds
    }));
    setJournalEntries(formattedEntries);
  } catch (error: unknown) {
    setError("Failed to fetch journals.");
    console.error("Error fetching journals:", error);
  }
};

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
      setError("Failed to logout.");
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
      getNickname();
      fetchJournals();
    }
  }, [isAuthenticated, actor]);

  const toggleSidebar = useCallback(() => {
    setSidebarActive((prev) => !prev);
  }, []);

  const handleMoodFilter = useCallback(
    (mood: string) => {
      playSound(mood);
      setSelectedMood((prev) => (prev === mood ? null : mood));
    },
    [playSound]
  );

  const dateToMoodMap = useMemo(() => {
    const map = new Map<string, Set<string>>();

    journalEntries.forEach((entry) => {
      if (entry.dateObj instanceof Date) {
        const dateKey = `${entry.dateObj.getFullYear()}-${entry.dateObj.getMonth()}-${entry.dateObj.getDate()}`;
        if (!map.has(dateKey)) {
          map.set(dateKey, new Set([entry.mood]));
        } else {
          map.get(dateKey)!.add(entry.mood);
        }
      }
    });

    return map;
  }, [journalEntries]);

  const renderDayContent = useCallback(
    (day: Date): React.ReactNode => {
      const dateKey = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`;
      const moodsSet = dateToMoodMap.get(dateKey);
      if (moodsSet) {
        return <div>{Array.from(moodsSet).join(", ")}</div>;
      }
      return day.getDate();
    },
    [dateToMoodMap]
  );

  const clearDateSelection = useCallback(() => {
    setSelected(null);
  }, []);

  const moodCounts = useMemo<MoodCount>(() => {
    const counts: MoodCount = {
      happy: 0,
      sad: 0,
      angry: 0,
      anxious: 0,
      exhausted: 0,
      neutral: 0,
    };

    journalEntries.forEach((entry) => {
      if (entry.mood && counts[entry.mood as keyof MoodCount] !== undefined) {
        counts[entry.mood as keyof MoodCount]++;
      }
    });

    return counts;
  }, [journalEntries]);

  const tasks = useMemo<PieChartData[]>(() => {
    return [
      { name: "Happy", value: moodCounts.happy },
      { name: "Exhausted", value: moodCounts.exhausted },
      { name: "Angry", value: moodCounts.angry },
      { name: "Sad", value: moodCounts.sad },
      { name: "Neutral", value: moodCounts.neutral },
      { name: "Anxious", value: moodCounts.anxious },
    ];
  }, [moodCounts]);

  const totalTasks = useMemo(() => {
    return tasks.reduce((sum, task) => sum + task.value, 0);
  }, [tasks]);

  const dominantMood = useMemo(() => {
    return tasks.reduce(
      (max, task) => (task.value > max.value ? task : max),
      tasks[0] || { name: "Neutral", value: 0 }
    );
  }, [tasks]);

  const tasksNameLabel = "Journal";

  const getMoodMessage = useCallback((mood: PieChartData): string => {
    if (mood.name === "Happy") {
      return "That means you had more positive days than negative ones. Keep it up and continue nurturing your positive energy!";
    }
    return `You've been feeling ${mood.name.toLowerCase()} quite often. Consider activities that might help improve your mood.`;
  }, []);

  const moodEmojis: Record<string, JSX.Element> = {
    happy: <img src={HappyImg} alt="Happy" className="mood-emojis" />,
    sad: <img src={SadImg} alt="Sad" className="mood-emojis" />,
    angry: <img src={AngryImg} alt="Angry" className="mood-emojis" />,
    anxious: <img src={AnxiousImg} alt="Anxious" className="mood-emojis" />,
    exhausted: (
      <img src={ExhaustedImg} alt="Exhausted" className="mood-emojis" />
    ),
    neutral: <img src={NeutralImg} alt="Neutral" className="mood-emojis" />,
  };

  const filteredJournals = useMemo(() => {
    return journalEntries.filter((entry) => {
      const matchesSearch =
        entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.content.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesDate = selected
        ? entry.dateObj instanceof Date &&
          entry.dateObj.getDate() === selected.getDate() &&
          entry.dateObj.getMonth() === selected.getMonth() &&
          entry.dateObj.getFullYear() === selected.getFullYear()
        : true;

      const matchesMood = selectedMood ? entry.mood === selectedMood : true;
      return matchesSearch && matchesDate && matchesMood;
    });
  }, [journalEntries, searchQuery, selected, selectedMood]);

  const clearAllFilters = useCallback(() => {
    setSelected(null);
    setSelectedMood(null);
    setSearchQuery("");
  }, []);

  const handleAddJournal = useCallback(() => {
    navigate("/add-journal");
  }, [navigate]);

  const handleEditJournal = useCallback(
  (id: string) => {
    const journalToEdit = journalEntries.find((entry) => entry.id === id);
    if (journalToEdit) {
      console.log("Navigating to edit journal with data:", journalToEdit); // Tambahkan log untuk debugging
      navigate("/add-journal", { state: { journalToEdit } });
    } else {
      console.error("Journal with id", id, "not found");
      Swal.fire({
        title: "Error",
        text: "Journal not found",
        icon: "error",
        confirmButtonColor: "#92A75C",
      });
    }
  },
  [journalEntries, navigate]
);

  const handleDeleteJournal = useCallback(
    async (id: string) => {
      if (!actor) return;

      Swal.fire({
        title: "Are you sure?",
        text: "You won't be able to revert this!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Yes, delete it!",
      }).then(async (result) => {
        if (result.isConfirmed) {
          try {
            const deleteResult = await actor.deleteJournalById(BigInt(id));
            if ("ok" in deleteResult) {
              const updatedEntries = journalEntries.filter(
                (entry) => entry.id !== id
              );
              setJournalEntries(updatedEntries);
              Swal.fire("Deleted!", "Your journal has been deleted.", "success");
            } else {
              setError(extractErrorMessage(deleteResult.err));
            }
          } catch (error) {
            setError("Failed to delete journal.");
            console.error(error);
          }
        }
      });
    },
    [journalEntries, actor]
  );

  if (!isAuthenticated) {
    navigate("/");
    return null;
  }

  return (
    <div className="app">
      {error && <div className="alert alert-danger">{error}</div>}
      <nav className="navbar navbar-expand-lg navbar-light bg-white fixed-top d-lg-none">
        <div className="container-fluid">
          <a className="navbar-brand" href="#">
            Moodyan
          </a>
          <button
            className="navbar-toggler"
            type="button"
            onClick={toggleSidebar}
            aria-controls="navbarContent"
            aria-expanded={sidebarActive}
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
        </div>
      </nav>

      <div className={`sidebar ${sidebarActive ? "active" : ""}`}>
        <h4 className="font-caveat">Hi there, {displayNickname || "User"}!</h4>
        <hr />

        <div className="filter-section">
          <h5>
            <b>Filter by Calendar</b>
          </h5>
          
        </div>

        <div className="filter-section">
          <div className="d-flex justify-content-between align-items-center">
            <h5>
              <b>Filter by Emot</b>
            </h5>
            {selectedMood && (
              <button
                onClick={() => setSelectedMood(null)}
                className="clear-filter-btn"
              >
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
            <div className="selected-mood-info">
              <p>
                <b>Journal about {selectedMood}</b>
              </p>
            </div>
          )}
        </div>

        <div className="logo-section">
          <h4 className="font-caveat">Moodyan</h4>
          <button
            className="btn btn-outline-danger w-100 mt-2"
            onClick={handleLogout}
            type="button"
          >
            Logout
          </button>
        </div>
      </div>

      <div className={`main-content ${sidebarActive ? "active" : ""}`}>
        <div className="mood-journey">
          <div className="row">
            <div className="col-lg-4 col-md-12">
              <div className="dominant-mood-center">
                <MoodPieChart
                  tasks={tasks}
                  totalTasks={totalTasks}
                  labelText={tasksNameLabel}
                />
              </div>
            </div>

            <div className="col-lg-8 col-md-12 statistic">
              <div className="d-flex flex-wrap">
                {tasks.map((mood, index) => (
                  <MoodStatItem
                    key={index}
                    name={mood.name}
                    value={mood.value}
                  />
                ))}
              </div>

              <div>
                <h1 className="title-statistik">
                  {totalTasks > 0 ? (
                    <>
                      You felt <span>{dominantMood.name.toLowerCase()}</span>{" "}
                      {dominantMood.value}{" "}
                      {dominantMood.value === 1 ? "time" : "times"}!
                    </>
                  ) : (
                    <>No journal entries yet</>
                  )}
                </h1>
                {totalTasks > 0 && <p>{getMoodMessage(dominantMood)}</p>}
              </div>
            </div>
          </div>
        </div>

        <div className="quote-section">
          <h2 className="font-caveat">
            Dreams grow not in comfort, but in the courage to begin.
          </h2>
        </div>

        <div className="journal-section">
          <h5>
            <b>Journal Entries</b>
            {(selected || selectedMood) && (
              <span className="ms-2">
                <button
                  onClick={clearAllFilters}
                  className="btn btn-success btn-sm"
                >
                  Show All
                </button>
              </span>
            )}
          </h5>

          <div className="search-filter">
            <div className="search-bar">
              <FaSearch />
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
              <p>
                <b>New Journal</b>
              </p>
            </div>

            {filteredJournals.length > 0 ? (
              filteredJournals.map((entry) => (
                <div className={`journal-card ${entry.mood}`} key={entry.id}>
                  <div className="d-flex">
                    <div>
                      <h3>
                        <b>{entry.title}</b>
                      </h3>
                      <p className="journal-date">{entry.date}</p>
                    </div>
                    <div className="mood-indicator">
                      <span className="mood-emoji">
                        {moodEmojis[entry.mood]}
                      </span>
                    </div>
                  </div>
                  <p className="journal-content">
                    {entry.content.length > 100
                      ? entry.content.substring(0, 100) + "..."
                      : entry.content}
                  </p>
                  <div className="journal-actions">
                    <button
                      className="btn-card"
                      onClick={() => handleEditJournal(entry.id)}
                      type="button"
                    >
                      <FaPen size={14} />
                      <span> Edit</span>
                    </button>

                    <button
                      className="btn-card"
                      onClick={() => handleDeleteJournal(entry.id)}
                      type="button"
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
    </div>
  );
};

export default Home;