import { useEffect, useState } from "react";
import { useAuth } from "../hooks/use-auth";
import { Journal } from "declarations/moodyan_backend/moodyan_backend.did";

export default function Test() {
  const { isAuthenticated, principal, actor, login, logout } = useAuth();

  const whoami = async () => {
    if (!actor) return;
    const result = await actor.whoami();
    console.log(result);
  };

  const [title, setTitle] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [journals, setJournals] = useState<Journal[]>([]);
  const [error, setError] = useState<string | null>("");
  const [loading, setLoading] = useState<boolean>(false);

  const fetchJournals = async () => {
    if (!actor) return;
    setLoading(true);

    try {
      const result = await actor.findAllJournals([], []);
      setJournals(result);
    } catch (error) {
      setError("Failed to fetch journals.");
      console.error(error);
    }

    setLoading(false);
  };

  const handleCreateJournal = async () => {
    if (!actor) return;
    setLoading(true);

    try {
      const result = await actor.createJournal(title, content);
      if ("ok" in result) {
        setJournals([...journals, result.ok]);
      } else {
        setError("Failed to create journal.");
        console.error(result.err);
      }
    } catch (error) {
      setError("Failed to create journal.");
      console.error(error);
    }

    setLoading(false);
  };

  useEffect(() => {
    if (isAuthenticated) fetchJournals();
  }, [isAuthenticated]);

  return (
    <div>
      <h1>Journal App</h1>

      <div className="auth-section">
        {!isAuthenticated ? (
          <button onClick={login}>Login with Internet Identity</button>
        ) : (
          <button onClick={logout}>Logout</button>
        )}
      </div>

      {principal && (
        <div>
          <p>
            Your Principal: <strong>{principal.toString()}</strong>
          </p>
        </div>
      )}

      {isAuthenticated && (
        <div>
          <h2>Create a New Journal</h2>
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <br />
          <textarea
            placeholder="Content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <br />
          <button onClick={handleCreateJournal}>Create Journal</button>

          {error && <p style={{ color: "red" }}>{error}</p>}
        </div>
      )}

      {loading ? (
        <p>Loading journals...</p>
      ) : (
        <div>
          <h2>All Journals</h2>
          {journals.length === 0 ? (
            <p>No journals found.</p>
          ) : (
            <ul>
              {journals.map((journal) => (
                <li key={journal.id}>
                  <strong>{journal.title}</strong> <br />
                  {journal.content} <br />
                  Mood: {journal.mood ?? "N/A"} <br />
                  Reflection: {journal.reflection ?? "N/A"} <br />
                  Date:{" "}
                  {new Date(
                    Number(journal.createdAt / 1_000_000n)
                  ).toLocaleString()}
                  <hr />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}