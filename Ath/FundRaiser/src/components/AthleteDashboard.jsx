import React, { useState, useEffect, useCallback } from 'react';

const AthleteDashboard = ({ athleteId = 1 }) => {
  const [campaigns, setCampaigns] = useState([]);
  const [donations, setDonations] = useState([]);
  const [athlete, setAthlete] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newCampaign, setNewCampaign] = useState({ title: '', goal: '', story: '' });
  const [editCampaign, setEditCampaign] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedStories, setExpandedStories] = useState({});

  const loadData = useCallback(() => {
    try {
      setLoading(true);
      setError('');

      const savedCampaigns = JSON.parse(localStorage.getItem('campaigns')) || [];
      console.log('Loaded campaigns from localStorage:', savedCampaigns); // Debug log
      const athleteCampaigns = savedCampaigns.filter(c => c.athleteId === athleteId);
      setCampaigns(athleteCampaigns);

      const savedDonations = JSON.parse(localStorage.getItem('donations')) || [];
      const athleteDonations = savedDonations.filter(d => athleteCampaigns.some(c => c.id === d.campaignId));
      setDonations(athleteDonations);

      const adminData = JSON.parse(localStorage.getItem('adminData')) || { athletes: [] };
      const athleteData = adminData.athletes.find(a => a.id === athleteId);
      setAthlete(athleteData);

      if (!athleteData) {
        setError('Athlete data not found.');
      }
    } catch (err) {
      setError('Failed to load data. Please try again.');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  }, [athleteId]);

  useEffect(() => {
    loadData();

    const handleStorageChange = () => loadData();
    const handleCampaignUpdate = () => {
      console.log('Custom campaign-update event triggered in AthleteDashboard');
      loadData();
    };
    const handleDonationUpdate = (e) => {
      console.log('Custom donation-update event triggered in AthleteDashboard');
      loadData();
      const savedDonations = JSON.parse(localStorage.getItem('donations')) || [];
      const latestDonation = savedDonations.find(d => d.athleteId === athleteId && d.date === e.detail?.date);
      if (latestDonation) {
        setNotifications(prev => [
          `New donation of $${latestDonation.amount} from ${latestDonation.donorName}!`,
          ...prev.slice(0, 4),
        ]);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('campaign-update', handleCampaignUpdate);
    window.addEventListener('donation-update', handleDonationUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('campaign-update', handleCampaignUpdate);
      window.removeEventListener('donation-update', handleDonationUpdate);
    };
  }, [loadData]);

  const handleCreateCampaign = (e) => {
    e.preventDefault();
    if (!newCampaign.title || !newCampaign.goal || newCampaign.goal <= 0 || !newCampaign.story) {
      setError('Please enter a valid campaign title, goal, and story.');
      return;
    }

    const campaign = {
      id: Date.now(),
      title: newCampaign.title,
      goal: parseFloat(newCampaign.goal),
      story: newCampaign.story,
      fundsRaised: 0,
      status: 'active',
      athleteId,
    };
    console.log('New campaign created:', campaign); // Debug log

    const updatedCampaigns = [...campaigns, campaign];
    localStorage.setItem('campaigns', JSON.stringify(updatedCampaigns));
    console.log('Updated campaigns in localStorage:', updatedCampaigns); // Debug log

    const adminData = JSON.parse(localStorage.getItem('adminData')) || { campaigns: [] };
    adminData.campaigns = updatedCampaigns;
    localStorage.setItem('adminData', JSON.stringify(adminData));

    const updatedAthletes = adminData.athletes.map(a =>
      a.id === athleteId ? { ...a, campaigns: a.campaigns + 1 } : a
    );
    adminData.athletes = updatedAthletes;
    localStorage.setItem('adminData', JSON.stringify(adminData));

    setCampaigns(updatedCampaigns);
    setNewCampaign({ title: '', goal: '', story: '' });
    setAthlete(prev => ({ ...prev, campaigns: prev.campaigns + 1 }));

    window.dispatchEvent(new Event('campaign-update'));
    window.dispatchEvent(new Event('storage'));
  };

  const handleDeleteCampaign = (campaignId) => {
    const updatedCampaigns = campaigns.filter(c => c.id !== campaignId);
    setCampaigns(updatedCampaigns);

    localStorage.setItem('campaigns', JSON.stringify(updatedCampaigns));

    const adminData = JSON.parse(localStorage.getItem('adminData')) || { campaigns: [] };
    adminData.campaigns = updatedCampaigns;
    localStorage.setItem('adminData', JSON.stringify(adminData));

    const updatedAthletes = adminData.athletes.map(a =>
      a.id === athleteId ? { ...a, campaigns: a.campaigns - 1 } : a
    );
    adminData.athletes = updatedAthletes;
    localStorage.setItem('adminData', JSON.stringify(adminData));

    setAthlete(prev => ({ ...prev, campaigns: prev.campaigns - 1 }));

    window.dispatchEvent(new Event('campaign-update'));
    window.dispatchEvent(new Event('storage'));
  };

  const handleUpdateCampaign = (e) => {
    e.preventDefault();
    if (!editCampaign.title || !editCampaign.goal || editCampaign.goal <= 0 || !editCampaign.story) {
      setError('Please enter a valid campaign title, goal, and story.');
      return;
    }

    const updatedCampaigns = campaigns.map(c =>
      c.id === editCampaign.id
        ? { ...c, title: editCampaign.title, goal: parseFloat(editCampaign.goal), story: editCampaign.story }
        : c
    );
    setCampaigns(updatedCampaigns);

    localStorage.setItem('campaigns', JSON.stringify(updatedCampaigns));

    const adminData = JSON.parse(localStorage.getItem('adminData')) || { campaigns: [] };
    adminData.campaigns = updatedCampaigns;
    localStorage.setItem('adminData', JSON.stringify(adminData));

    setIsModalOpen(false);
    setEditCampaign(null);

    window.dispatchEvent(new Event('campaign-update'));
    window.dispatchEvent(new Event('storage'));
  };

  const openEditModal = (campaign) => {
    setEditCampaign({ ...campaign });
    setIsModalOpen(true);
  };

  const toggleStoryExpand = (campaignId) => {
    setExpandedStories(prev => ({
      ...prev,
      [campaignId]: !prev[campaignId],
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-blue-100 p-6 lg:p-10 overflow-hidden">
      <div className="max-w-5xl mx-auto relative">
        {/* Background Glow Effect */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-blue-200/30 via-blue-100/30 to-blue-50/30 blur-3xl"></div>

        {/* Header */}
        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-800 mb-10 tracking-tight drop-shadow-lg">
          Athlete Dashboard - <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-blue-400">{athlete?.name || 'Loading...'}</span>
        </h1>

        {/* Notifications */}
        {notifications.length > 0 && (
          <div className="mb-8 space-y-3">
            {notifications.map((notification, index) => (
              <div
                key={index}
                className="relative bg-blue-50/80 border border-blue-200 rounded-xl p-4 flex justify-between items-center text-blue-800 shadow-lg hover:shadow-xl transition-all duration-300 animate-slide-in"
              >
                <span className="text-sm font-medium">{notification}</span>
                <button
                  onClick={() => setNotifications(prev => prev.filter((_, i) => i !== index))}
                  className="text-blue-600 hover:text-blue-800 transition-colors duration-200"
                >
                  ✕
                </button>
                <div className="absolute inset-0 -z-10 bg-gradient-to-r from-blue-100/20 to-blue-200/20 rounded-xl"></div>
              </div>
            ))}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-8 bg-red-50/80 border border-red-200 rounded-xl p-4 text-red-600 shadow-lg">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="relative">
              <div className="h-16 w-16 rounded-full border-4 border-t-transparent border-blue-400 animate-spin"></div>
              <div className="h-16 w-16 rounded-full border-4 border-t-transparent border-blue-300 animate-spin absolute top-0 left-0 opacity-50" style={{ animationDuration: '1.5s' }}></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-blue-600 text-sm font-semibold">Loading...</div>
            </div>
          </div>
        )}

        {!loading && (
          <>
            {/* Create Campaign Form */}
            <div className="bg-white/90 border border-blue-200 rounded-2xl p-8 mb-10 shadow-2xl hover:shadow-3xl transition-all duration-500">
              <h2 className="text-3xl font-bold text-gray-800 mb-6 tracking-wide drop-shadow-md">Create a New Campaign</h2>
              <form onSubmit={handleCreateCampaign} className="space-y-6">
                <div className="relative">
                  <div className="flex items-center space-x-3">
                    <svg className="w-5 h-5 text-blue-400 absolute left-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7m-9 5v6h4v-6m2-2l2 2m-9-9h9"></path>
                    </svg>
                    <input
                      type="text"
                      value={newCampaign.title}
                      onChange={(e) => setNewCampaign({ ...newCampaign, title: e.target.value })}
                      className="w-full pl-12 pr-5 py-3 bg-white border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-300 shadow-sm hover:shadow-md peer"
                      placeholder=" "
                      required
                    />
                  </div>
                  <label className="absolute left-12 top-3 text-gray-400 text-sm transition-all duration-300 peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:top-[-10px] peer-focus:text-sm peer-focus:text-blue-500">
                    Campaign Title
                  </label>
                </div>
                <div className="relative">
                  <div className="flex items-center space-x-3">
                    <svg className="w-5 h-5 text-blue-400 absolute left-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-2c2.21 0 4 1.79 4 4s-1.79 4-4 4-4-1.79-4-4 1.79-4 4-4zm0 10c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"></path>
                    </svg>
                    <input
                      type="number"
                      value={newCampaign.goal}
                      onChange={(e) => setNewCampaign({ ...newCampaign, goal: e.target.value })}
                      className="w-full pl-12 pr-5 py-3 bg-white border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-300 shadow-sm hover:shadow-md peer"
                      placeholder=" "
                      min="1"
                      required
                    />
                  </div>
                  <label className="absolute left-12 top-3 text-gray-400 text-sm transition-all duration-300 peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:top-[-10px] peer-focus:text-sm peer-focus:text-blue-500">
                    Funding Goal ($)
                  </label>
                </div>
                <div className="relative">
                  <div className="flex items-start space-x-3">
                    <svg className="w-5 h-5 text-blue-400 absolute left-4 mt-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m-12 1h8m-8 4h12m-4 4l4-4m-4 4l4 4"></path>
                    </svg>
                    <textarea
                      value={newCampaign.story}
                      onChange={(e) => setNewCampaign({ ...newCampaign, story: e.target.value })}
                      className="w-full pl-12 pr-5 py-3 bg-white border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-300 shadow-sm hover:shadow-md peer resize-y min-h-[120px]"
                      placeholder=" "
                      required
                    />
                  </div>
                  <label className="absolute left-12 top-3 text-gray-400 text-sm transition-all duration-300 peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:top-[-10px] peer-focus:text-sm peer-focus:text-blue-500">
                    Campaign Story
                  </label>
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-blue-700 transform hover:scale-105 transition-all duration-300 shadow-lg"
                >
                  Create Campaign
                </button>
              </form>
            </div>

            {/* Athlete Overview */}
            <div className="bg-white/90 border border-blue-200 rounded-2xl p-8 mb-10 shadow-2xl hover:shadow-3xl transition-all duration-500">
              <h2 className="text-3xl font-bold text-gray-800 mb-6 tracking-wide drop-shadow-md">Overview</h2>
              {athlete ? (
                <div className="space-y-4 text-gray-700">
                  <p className="text-base flex items-center">
                    <span className="w-32 font-semibold text-blue-600">Email:</span>
                    <span className="ml-4">{athlete.email}</span>
                  </p>
                  <p className="text-base flex items-center">
                    <span className="w-32 font-semibold text-blue-600">Joined:</span>
                    <span className="ml-4">{new Date(athlete.joined).toLocaleDateString()}</span>
                  </p>
                  <p className="text-base flex items-center">
                    <span className="w-32 font-semibold text-blue-600">Total Campaigns:</span>
                    <span className="ml-4">{athlete.campaigns}</span>
                  </p>
                  <p className="text-base flex items-center">
                    <span className="w-32 font-semibold text-blue-600">Total Raised:</span>
                    <span className="ml-4 text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-blue-400">
                      ${athlete.totalRaised.toLocaleString()}
                    </span>
                  </p>
                </div>
              ) : (
                <p className="text-gray-500">Athlete data not found.</p>
              )}
            </div>

            {/* Campaigns */}
            <div className="bg-white/90 border border-blue-200 rounded-2xl p-8 mb-10 shadow-2xl">
              <h2 className="text-3xl font-bold text-gray-800 mb-6 tracking-wide drop-shadow-md">Your Campaigns</h2>
              {campaigns.length === 0 ? (
                <p className="text-center py-8 text-gray-500">No campaigns found.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {campaigns.map((campaign) => {
                    console.log('Rendering campaign:', campaign); // Debug log
                    return (
                      <div
                        key={campaign.id}
                        className="relative bg-blue-50/50 border border-blue-200 rounded-xl p-6 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 group"
                      >
                        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-100/20 to-blue-200/20 rounded-xl group-hover:from-blue-100/30 group-hover:to-blue-200/30 transition-all duration-300"></div>
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-xl font-semibold text-gray-800 mb-2">{campaign.title}</h3>
                            <p className="text-sm text-gray-600">
                              Goal: <span className="font-medium">${campaign.goal.toLocaleString()}</span> | Raised: <span className="font-medium text-blue-600">${(campaign.fundsRaised || 0).toLocaleString()}</span>
                            </p>
                            <p className="text-sm text-gray-600">
                              Status: <span className={`font-medium ${campaign.status === 'active' ? 'text-green-600' : 'text-yellow-600'}`}>{campaign.status}</span>
                            </p>
                            <div className="mt-2">
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">Story:</span>
                                {campaign.story ? (
                                  <span className={`ml-1 ${expandedStories[campaign.id] ? '' : 'line-clamp-2'}`}>
                                    {campaign.story}
                                  </span>
                                ) : (
                                  <span className="ml-1 italic text-gray-500">No story provided.</span>
                                )}
                              </p>
                              {campaign.story && campaign.story.length > 100 && (
                                <button
                                  onClick={() => toggleStoryExpand(campaign.id)}
                                  className="text-blue-500 hover:text-blue-600 text-sm mt-1 transition-colors duration-200"
                                >
                                  {expandedStories[campaign.id] ? 'Read Less' : 'Read More'}
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="text-right space-y-2">
                            <p className="text-sm text-gray-500">
                              Progress: <span className="font-medium text-blue-600">{((campaign.fundsRaised || 0) / campaign.goal * 100).toFixed(1)}%</span>
                            </p>
                            <div className="w-20 h-2 bg-gray-200 rounded-full mt-2">
                              <div
                                className="h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(((campaign.fundsRaised || 0) / campaign.goal * 100), 100)}%` }}
                              ></div>
                            </div>
                            <div className="flex justify-end space-x-2 mt-4">
                              <button
                                onClick={() => openEditModal(campaign)}
                                className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-200 text-sm"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteCampaign(campaign.id)}
                                className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all duration-200 text-sm"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Donations */}
            <div className="bg-white/90 border border-blue-200 rounded-2xl p-8 shadow-2xl">
              <h2 className="text-3xl font-bold text-gray-800 mb-6 tracking-wide drop-shadow-md">Donation History</h2>
              {donations.length === 0 ? (
                <p className="text-center py-8 text-gray-500">No donations yet.</p>
              ) : (
                <div className="space-y-4">
                  {donations.map((donation) => (
                    <div
                      key={donation.id}
                      className="relative bg-blue-50/50 border border-blue-200 rounded-xl p-6 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 group"
                    >
                      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-100/20 to-blue-200/20 rounded-xl group-hover:from-blue-100/30 group-hover:to-blue-200/30 transition-all duration-300"></div>
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800">{donation.donorName}</h3>
                          <p className="text-sm text-gray-600">{donation.donorEmail}</p>
                          <p className="text-sm text-gray-600">Campaign: {donation.campaignTitle}</p>
                          <p className="text-sm text-gray-600">
                            Status: <span className={`font-medium ${donation.status === 'completed' ? 'text-green-600' : donation.status === 'pending' ? 'text-yellow-600' : 'text-red-600'}`}>{donation.status}</span>
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-blue-400">
                            ${donation.amount.toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(donation.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Edit Campaign Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Edit Campaign</h2>
              <form onSubmit={handleUpdateCampaign} className="space-y-6">
                <div className="relative">
                  <div className="flex items-center space-x-3">
                    <svg className="w-5 h-5 text-blue-400 absolute left-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7m-9 5v6h4v-6m2-2l2 2m-9-9h9"></path>
                    </svg>
                    <input
                      type="text"
                      value={editCampaign.title}
                      onChange={(e) => setEditCampaign({ ...editCampaign, title: e.target.value })}
                      className="w-full pl-12 pr-5 py-3 bg-white border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-300 shadow-sm hover:shadow-md peer"
                      placeholder=" "
                      required
                    />
                  </div>
                  <label className="absolute left-12 top-3 text-gray-400 text-sm transition-all duration-300 peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:top-[-10px] peer-focus:text-sm peer-focus:text-blue-500">
                    Campaign Title
                  </label>
                </div>
                <div className="relative">
                  <div className="flex items-center space-x-3">
                    <svg className="w-5 h-5 text-blue-400 absolute left-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-2c2.21 0 4 1.79 4 4s-1.79 4-4 4-4-1.79-4-4 1.79-4 4-4zm0 10c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"></path>
                    </svg>
                    <input
                      type="number"
                      value={editCampaign.goal}
                      onChange={(e) => setEditCampaign({ ...editCampaign, goal: e.target.value })}
                      className="w-full pl-12 pr-5 py-3 bg-white border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-300 shadow-sm hover:shadow-md peer"
                      placeholder=" "
                      min="1"
                      required
                    />
                  </div>
                  <label className="absolute left-12 top-3 text-gray-400 text-sm transition-all duration-300 peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:top-[-10px] peer-focus:text-sm peer-focus:text-blue-500">
                    Funding Goal ($)
                  </label>
                </div>
                <div className="relative">
                  <div className="flex items-start space-x-3">
                    <svg className="w-5 h-5 text-blue-400 absolute left-4 mt-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m-12 1h8m-8 4h12m-4 4l4-4m-4 4l4 4"></path>
                    </svg>
                    <textarea
                      value={editCampaign.story}
                      onChange={(e) => setEditCampaign({ ...editCampaign, story: e.target.value })}
                      className="w-full pl-12 pr-5 py-3 bg-white border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-300 shadow-sm hover:shadow-md peer resize-y min-h-[120px]"
                      placeholder=" "
                      required
                    />
                  </div>
                  <label className="absolute left-12 top-3 text-gray-400 text-sm transition-all duration-300 peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:top-[-10px] peer-focus:text-sm peer-focus:text-blue-500">
                    Campaign Story
                  </label>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-200"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AthleteDashboard;