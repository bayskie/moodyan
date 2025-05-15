import React, { useState } from 'react';
import { moodyan_backend } from 'declarations/moodyan_backend';

export default function JournalApp() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [journals, setJournals] = useState([]);
  const [message, setMessage] = useState('');

  // Create a new journal entry
  const handleCreate = async () => {
    const result = await moodyan_backend.createJournal(title, content);
    if (result.ok) {
      setMessage('Journal created!');
      setTitle('');
      setContent('');
      fetchJournals();
    } else {
      setMessage('Error: ' + JSON.stringify(result.err));
    }
  };

  // List all journals
  const fetchJournals = async () => {
    const result = await moodyan_backend.findAllJournals(null, null);
    setJournals(result);
  };

  return (
    <div>
      <h2>Create Journal</h2>
      <input
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Title"
      />
      <br />
      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="Content"
      />
      <br />
      <button onClick={handleCreate}>Create</button>
      <div>{message}</div>
      <h2>All Journals</h2>
      <button onClick={fetchJournals}>Refresh List</button>
      <ul>
        {journals.map((j, idx) => (
          <li key={idx}>
            <strong>{j.title}</strong>: {j.content}
          </li>
        ))}
      </ul>
    </div>
  );
}