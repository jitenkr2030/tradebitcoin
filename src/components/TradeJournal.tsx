import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addJournalEntry } from '../store/slices/tradingSlice';
import { RootState } from '../store/store';
import { format } from 'date-fns';
import { Book, Plus, Filter } from 'lucide-react';

interface JournalEntry {
  id: string;
  type: 'entry' | 'exit' | 'note';
  content: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  tags: string[];
  timestamp: string;
}

function TradeJournal() {
  const dispatch = useDispatch();
  const journal = useSelector((state: RootState) => state.trading.journal);
  const [newEntry, setNewEntry] = useState('');
  const [selectedType, setSelectedType] = useState<'entry' | 'exit' | 'note'>('note');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [filterType, setFilterType] = useState<string>('all');

  const handleAddEntry = () => {
    if (!newEntry.trim()) return;

    const entry: JournalEntry = {
      id: Date.now().toString(),
      type: selectedType,
      content: newEntry,
      sentiment: 'neutral',
      tags: selectedTags,
      timestamp: new Date().toISOString()
    };

    dispatch(addJournalEntry(entry));
    setNewEntry('');
    setSelectedTags([]);
  };

  const filteredEntries = journal.filter(entry => 
    filterType === 'all' || entry.type === filterType
  );

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Book className="w-6 h-6 text-blue-400" />
          <h2 className="text-2xl font-bold">Trade Journal</h2>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-gray-700 rounded-lg px-3 py-1 text-sm"
          >
            <option value="all">All Entries</option>
            <option value="entry">Entries</option>
            <option value="exit">Exits</option>
            <option value="note">Notes</option>
          </select>
          <Filter className="w-5 h-5 text-gray-400" />
        </div>
      </div>

      {/* New Entry Form */}
      <div className="mb-6 space-y-4">
        <div className="flex space-x-4">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as 'entry' | 'exit' | 'note')}
            className="bg-gray-700 rounded-lg px-4 py-2"
          >
            <option value="entry">Trade Entry</option>
            <option value="exit">Trade Exit</option>
            <option value="note">Note</option>
          </select>
          <input
            type="text"
            placeholder="Add tags (comma separated)"
            value={selectedTags.join(', ')}
            onChange={(e) => setSelectedTags(e.target.value.split(',').map(tag => tag.trim()))}
            className="flex-1 bg-gray-700 rounded-lg px-4 py-2"
          />
        </div>
        <div className="flex space-x-4">
          <textarea
            value={newEntry}
            onChange={(e) => setNewEntry(e.target.value)}
            placeholder="Write your journal entry..."
            className="flex-1 bg-gray-700 rounded-lg px-4 py-2 min-h-[100px]"
          />
          <button
            onClick={handleAddEntry}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Entry
          </button>
        </div>
      </div>

      {/* Journal Entries */}
      <div className="space-y-4">
        {filteredEntries.map((entry) => (
          <div key={entry.id} className="bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded text-sm ${
                  entry.type === 'entry' ? 'bg-green-500/20 text-green-400' :
                  entry.type === 'exit' ? 'bg-red-500/20 text-red-400' :
                  'bg-blue-500/20 text-blue-400'
                }`}>
                  {entry.type.charAt(0).toUpperCase() + entry.type.slice(1)}
                </span>
                {entry.tags.map((tag, i) => (
                  <span key={i} className="bg-gray-600 px-2 py-1 rounded text-sm">
                    {tag}
                  </span>
                ))}
              </div>
              <span className="text-sm text-gray-400">
                {format(new Date(entry.timestamp), 'MMM d, yyyy HH:mm')}
              </span>
            </div>
            <p className="text-gray-200">{entry.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TradeJournal;