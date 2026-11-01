import React, { useState } from 'react';
import { useLifeOS } from '../../context/LifeOSContext';
import { JournalEntry } from '../../types';
import {
  PenLine,
  Image as ImageIcon,
  Trash2,
  Edit3,
  Search,
  Calendar,
  X,
  Plus,
  Smile,
  Tag,
  Check,
} from 'lucide-react';

export const JournalModule: React.FC = () => {
  const {
    selectedDate,
    journalEntries,
    saveJournalEntry,
    deleteJournalEntry,
    showIslandNotice,
  } = useLifeOS();

  const [isWriting, setIsWriting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Form states
  const [title, setTitle] = useState('');
  const [story, setStory] = useState('');
  const [moodTag, setMoodTag] = useState('Energized');
  const [tagsInput, setTagsInput] = useState('Reflection, Life');
  const [photos, setPhotos] = useState<string[]>([]);

  // Filter entries
  const filteredEntries = journalEntries.filter((entry) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      entry.title.toLowerCase().includes(q) ||
      entry.story.toLowerCase().includes(q) ||
      entry.tags.some((t) => t.toLowerCase().includes(q)) ||
      entry.date.includes(q)
    );
  });

  const handleStartNew = () => {
    setEditingId(null);
    setTitle(`Story of ${selectedDate}`);
    setStory('');
    setMoodTag('Energized');
    setTagsInput('Reflection');
    setPhotos([]);
    setIsWriting(true);
  };

  const handleEditEntry = (entry: JournalEntry) => {
    setEditingId(entry.id);
    setTitle(entry.title);
    setStory(entry.story);
    setMoodTag(entry.moodTag || 'Energized');
    setTagsInput(entry.tags.join(', '));
    setPhotos(entry.photos || []);
    setIsWriting(true);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const base64 = uploadEvent.target?.result as string;
        if (base64) {
          setPhotos((prev) => [...prev, base64]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!story.trim()) return;

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const entry: JournalEntry = {
      id: editingId || `journal_${Date.now()}`,
      date: selectedDate,
      timestamp: new Date().toISOString(),
      title: title.trim() || `Journal Entry · ${selectedDate}`,
      story: story.trim(),
      photos,
      moodTag,
      tags,
    };

    await saveJournalEntry(entry);
    setIsWriting(false);
    setEditingId(null);
  };

  const moods = ['Energized', 'Peaceful', 'Focused', 'Grateful', 'Challenging', 'Thoughtful'];

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold tracking-wider uppercase text-indigo-500">
            Module 02
          </p>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            My Journal & Diary
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Write the complete story of your day with photos, timestamps, and history.
          </p>
        </div>

        {!isWriting && (
          <button
            onClick={handleStartNew}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md active:scale-95 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Write Entry</span>
          </button>
        )}
      </div>

      {/* Writing / Editing Form */}
      {isWriting && (
        <form
          onSubmit={handleSave}
          className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#121622] border border-slate-200/80 dark:border-white/10 shadow-lg space-y-3.5 animate-in fade-in duration-150"
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/5">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <PenLine className="w-3.5 h-3.5 text-indigo-500" />
              {editingId ? 'Edit Journal Story' : 'New Journal Entry'}
            </h3>
            <button
              type="button"
              onClick={() => setIsWriting(false)}
              className="text-xs text-slate-400 hover:text-slate-700 dark:hover:text-white"
            >
              Cancel
            </button>
          </div>

          <div>
            <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give today's chapter a title..."
              className="mt-1 w-full p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white"
            />
          </div>

          {/* Mood selection */}
          <div>
            <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Smile className="w-3 h-3 text-amber-500" /> Mood Tone
            </label>
            <div className="mt-1 flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {moods.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMoodTag(m)}
                  className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                    moodTag === m
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Story Body */}
          <div>
            <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
              Complete Story of Your Day
            </label>
            <textarea
              value={story}
              onChange={(e) => setStory(e.target.value)}
              rows={8}
              placeholder="What happened today? How did you feel? What were your wins, breakthroughs, thoughts, or conversations? Write freely..."
              className="mt-1 w-full p-3.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs sm:text-sm text-slate-800 dark:text-slate-100 leading-relaxed resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Photos Upload & Preview */}
          <div>
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <ImageIcon className="w-3 h-3 text-cyan-500" /> Photos & Memories
              </label>
              <label className="text-xs font-semibold text-indigo-500 hover:text-indigo-400 cursor-pointer">
                <span>+ Add Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
            </div>

            {photos.length > 0 && (
              <div className="mt-2 grid grid-cols-3 gap-2">
                {photos.map((photo, idx) => (
                  <div key={idx} className="relative rounded-xl overflow-hidden aspect-square border border-slate-200 dark:border-white/10 group">
                    <img
                      src={photo}
                      alt="Journal attachment"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(idx)}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 text-white flex items-center justify-center opacity-80 hover:opacity-100 transition"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tags */}
          <div>
            <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Tag className="w-3 h-3 text-slate-400" /> Tags (comma-separated)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="e.g. Health, Travel, Office, Reflection"
              className="mt-1 w-full p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsWriting(false)}
              className="px-4 py-2 text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!story.trim()}
              className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-semibold shadow-md active:scale-95 transition"
            >
              {editingId ? 'Update Story' : 'Save Story'}
            </button>
          </div>
        </form>
      )}

      {/* Search & Date Filter Bar */}
      <div className="p-3 rounded-2xl bg-white dark:bg-[#121622] border border-slate-200/80 dark:border-white/10 shadow-sm flex items-center gap-2">
        <Search className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search journal entries, keywords, tags, dates..."
          className="w-full bg-transparent text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Journal Entries Feed */}
      <div className="space-y-3">
        {filteredEntries.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white dark:bg-[#121622] border border-slate-200/80 dark:border-white/10 text-center space-y-2">
            <PenLine className="w-8 h-8 text-slate-400 mx-auto opacity-30" />
            <p className="text-xs text-slate-500">
              {searchQuery
                ? 'No journal entries match your search.'
                : 'No journal stories recorded yet. Tap "+ Write Entry" to record your day!'}
            </p>
          </div>
        ) : (
          filteredEntries.map((entry) => (
            <article
              key={entry.id}
              className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#121622] border border-slate-200/80 dark:border-white/10 shadow-sm space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="font-mono">{entry.date}</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-indigo-600 dark:text-cyan-400 font-medium">
                      {entry.moodTag || 'Recorded'}
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                    {entry.title}
                  </h2>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEditEntry(entry)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5"
                    aria-label="Edit Entry"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => deleteJournalEntry(entry.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-white/5"
                    aria-label="Delete Entry"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Story Text */}
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                {entry.story}
              </p>

              {/* Photos attached */}
              {entry.photos && entry.photos.length > 0 && (
                <div className="grid grid-cols-3 gap-2 pt-1">
                  {entry.photos.map((img, i) => (
                    <div key={i} className="rounded-xl overflow-hidden aspect-square border border-slate-200 dark:border-white/10">
                      <img
                        src={img}
                        alt="Journal photo"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Tags */}
              {entry.tags && entry.tags.length > 0 && (
                <div className="flex items-center gap-1.5 pt-1 text-[11px] text-slate-500">
                  {entry.tags.map((tag, tIdx) => (
                    <span key={tIdx} className="text-slate-500 dark:text-slate-400">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </article>
          ))
        )}
      </div>
    </div>
  );
};
