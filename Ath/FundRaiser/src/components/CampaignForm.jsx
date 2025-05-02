import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CampaignForm() {
  const [title, setTitle] = useState('');
  const [goal, setGoal] = useState('');
  const [story, setStory] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [campaigns, setCampaigns] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editGoal, setEditGoal] = useState('');
  const [editStory, setEditStory] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadCampaigns = () => {
      try {
        let stored = JSON.parse(localStorage.getItem('campaigns')) || [];
        // Ensure each campaign has the required fields
        stored = stored.map((c) => ({
          ...c,
          fundsRaised: Number(c.fundsRaised) || 0, // Ensure fundsRaised is a number
          goal: Number(c.goal) || 0, // Ensure goal is a number
          status: (Number(c.fundsRaised) || 0) >= (Number(c.goal) || 0) ? 'fulfilled' : 'pending',
        }));
        setCampaigns(stored);
        console.log('Campaigns loaded from localStorage:', stored);
      } catch (err) {
        console.error('Error loading campaigns from localStorage:', err);
        setError('Failed to load campaigns. Please refresh the page.');
      }
    };

    // Initial load
    loadCampaigns();

    // Listen for storage events (cross-tab updates)
    const handleStorageChange = (e) => {
      if (e.key === 'campaigns') {
        console.log('Storage event triggered with new value:', e.newValue);
        loadCampaigns();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // Polling for same-tab updates (every 2 seconds for faster updates)
    const pollingInterval = setInterval(() => {
      console.log('Polling localStorage for campaign updates...');
      loadCampaigns();
    }, 2000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(pollingInterval); // Clean up polling
    };
  }, []);

  const saveToLocalStorage = (campaignList, updateState = true) => {
    try {
      const updatedList = campaignList.map((c) => ({
        ...c,
        fundsRaised: Number(c.fundsRaised) || 0, // Ensure fundsRaised is a number
        goal: Number(c.goal) || 0, // Ensure goal is a number
        status: (Number(c.fundsRaised) || 0) >= (Number(c.goal) || 0) ? 'fulfilled' : 'pending',
      }));
      localStorage.setItem('campaigns', JSON.stringify(updatedList));
      if (updateState) {
        setCampaigns(updatedList);
      }
      window.dispatchEvent(new Event('storage'));
      console.log('Saved campaigns to localStorage:', updatedList);
    } catch (err) {
      console.error('Error saving campaigns to localStorage:', err);
      setError('Failed to save campaign. Please try again.');
    }
  };

  const logActivity = (message, amount = 0) => {
    try {
      const activities = JSON.parse(localStorage.getItem('activities')) || [];
      activities.unshift({
        message,
        timeAgo: new Date().toLocaleString(),
        amount,
      });
      localStorage.setItem('activities', JSON.stringify(activities.slice(0, 10)));
      window.dispatchEvent(new Event('storage'));
      console.log('Logged activity:', { message, amount });
    } catch (err) {
      console.error('Error logging activity:', err);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSubmitted(false);
    setError(null);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const newCampaign = {
        id: Date.now(),
        title,
        goal: parseFloat(goal) || 0,
        story,
        fundsRaised: 0,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      const updatedCampaigns = [newCampaign, ...campaigns];
      saveToLocalStorage(updatedCampaigns);
      logActivity(`Campaign "${title}" created`);

      setSubmitted(true);
      setTitle('');
      setGoal('');
      setStory('');
      setTimeout(() => setSubmitted(false), 3000);
    } catch (err) {
      setError('Failed to launch campaign');
      console.error('Submission error:', err);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (campaign) => {
    setEditingId(campaign.id);
    setEditTitle(campaign.title);
    setEditGoal(campaign.goal);
    setEditStory(campaign.story);
  };

  const saveEdit = () => {
    const updated = campaigns.map((c) =>
      c.id === editingId
        ? {
            ...c,
            title: editTitle,
            goal: parseFloat(editGoal) || 0,
            story: editStory,
          }
        : c
    );
    saveToLocalStorage(updated);
    logActivity(`Campaign "${editTitle}" updated`);
    setEditingId(null);
  };

  const deleteCampaign = (id) => {
    if (window.confirm('Are you sure you want to delete this campaign?')) {
      const filtered = campaigns.filter((c) => c.id !== id);
      saveToLocalStorage(filtered);
      logActivity(`Campaign "${campaigns.find((c) => c.id === id).title}" deleted`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/30 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-8"
        >
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Launch Your Campaign
            </h2>
            <p className="mt-2 text-gray-600">Inspire supporters with your story</p>
          </div>

          <form onSubmit={submit} className="space-y-6">
            <div className="relative group">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-5 py-3 text-lg bg-white/50 backdrop-blur-sm rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 placeholder-transparent peer"
                placeholder=" "
                required
              />
              <label className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none transition-all duration-300 peer-placeholder-shown:text-lg peer-placeholder-shown:top-1/2 peer-focus:top-0 peer-focus:text-sm peer-focus:text-blue-600 bg-white px-2">
                Campaign Title
              </label>
            </div>

            <div className="relative group">
              <input
                type="number"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                min="0"
                step="1"
                className="w-full px-5 py-3 text-lg bg-white/50 backdrop-blur-sm rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 placeholder-transparent peer"
                placeholder=" "
                required
              />
              <label className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none transition-all duration-300 peer-placeholder-shown:text-lg peer-placeholder-shown:top-1/2 peer-focus:top-0 peer-focus:text-sm peer-focus:text-blue-600 bg-white px-2">
                Funding Goal ($)
              </label>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">💰</div>
            </div>

            <div className="relative group">
              <textarea
                value={story}
                onChange={(e) => setStory(e.target.value)}
                className="w-full px-5 py-3 text-lg bg-white/50 backdrop-blur-sm rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 placeholder-transparent peer resize-y min-h-[150px]"
                placeholder=" "
                required
              />
              <label className="absolute left-4 top-4 text-gray-500 pointer-events-none transition-all duration-300 peer-placeholder-shown:text-lg peer-placeholder-shown:top-4 peer-focus:top-0 peer-focus:text-sm peer-focus:text-blue-600 bg-white px-2">
                Your Story
              </label>
              <div className="absolute right-4 bottom-4 text-gray-400">📖</div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-95 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin h-6 w-6 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>Launching...</span>
                </>
              ) : (
                <>
                  <span>🚀 Launch Campaign</span>
                </>
              )}
            </button>

            <AnimatePresence>
              {submitted && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="p-4 bg-green-100/50 border border-green-200 rounded-xl flex items-center space-x-3"
                >
                  <div className="h-8 w-8 bg-green-500 rounded-full flex items-center justify-center text-white">✓</div>
                  <span className="text-green-700 font-medium">Campaign successfully launched!</span>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-4 bg-red-100/50 border border-red-200 rounded-xl flex items-center space-x-3"
          >
            <span className="text-red-700 font-medium">{error}</span>
          </motion.div>
        )}

        {campaigns.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <h3 className="text-2xl font-bold text-gray-800">Your Campaigns</h3>
            <div className="grid gap-6">
              <AnimatePresence>
                {campaigns.map((c) => {
                  const leftAmount = Math.max((c.goal || 0) - (c.fundsRaised || 0), 0);
                  console.log(
                    `Rendering campaign ${c.id} (${c.title}): goal=${c.goal}, fundsRaised=${c.fundsRaised}, leftAmount=${leftAmount}`
                  );
                  return (
                    <motion.div
                      key={c.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="bg-white/30 backdrop-blur-lg border border-white/20 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          {editingId === c.id ? (
                            <>
                              <input
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                className="w-full px-3 py-2 rounded border mb-2"
                                placeholder="Campaign Title"
                              />
                              <input
                                type="number"
                                value={editGoal}
                                onChange={(e) => setEditGoal(e.target.value)}
                                min="0"
                                step="1"
                                className="w-full px-3 py-2 rounded border mb-2"
                                placeholder="Funding Goal ($)"
                              />
                              <textarea
                                value={editStory}
                                onChange={(e) => setEditStory(e.target.value)}
                                className="w-full px-3 py-2 rounded border mb-2"
                                placeholder="Your Story"
                              />
                              <div className="flex space-x-2">
                                <button
                                  onClick={saveEdit}
                                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditingId(null)}
                                  className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
                                >
                                  Cancel
                                </button>
                              </div>
                            </>
                          ) : (
                            <>
                              <h4 className="text-xl font-semibold text-gray-800">{c.title}</h4>
                              <div className="mt-2 flex items-center space-x-3 text-sm">
                                <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full">
                                  ${c.goal} Goal
                                </span>
                                <span className="px-3 py-1 bg-yellow-100 text-yellow-600 rounded-full">
                                  ${leftAmount} Left
                                </span>
                                {c.status === 'fulfilled' && (
                                  <span className="px-3 py-1 bg-purple-100 text-purple-600 rounded-full">
                                    Goal Achieved! 🎉
                                  </span>
                                )}
                                <span className="text-gray-500">{new Date(c.createdAt).toLocaleDateString()}</span>
                              </div>
                              <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5">
                                <div
                                  className="bg-blue-600 h-2.5 rounded-full"
                                  style={{ width: `${Math.min(((c.fundsRaised || 0) / (c.goal || 1)) * 100, 100)}%` }}
                                ></div>
                              </div>
                              <p className="mt-4 text-gray-600 leading-relaxed">{c.story}</p>
                            </>
                          )}
                        </div>
                        <div className="ml-4 flex flex-col items-center space-y-2">
                          {editingId !== c.id && (
                            <>
                              <button
                                onClick={() => startEdit(c)}
                                className="text-blue-600 hover:underline"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => deleteCampaign(c.id)}
                                className="text-red-600 hover:underline"
                              >
                                Delete
                              </button>
                            </>
                          )}
                          <div className="h-10 w-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white">
                            {c.status === 'pending' ? '⏳' : '✅'}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}