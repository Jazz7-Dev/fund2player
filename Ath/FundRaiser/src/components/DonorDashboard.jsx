import React, { useState, useEffect, useCallback } from 'react';
import {
  getDonations,
  getCampaigns,
  getDonorBalance,
  getBalanceHistory,
  addFunds,
  withdrawFunds,
  makeDonation,
} from '../api/fakeBackend';

const DonorDashboard = () => {
  const [donations, setDonations] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState('');
  const [donorName, setDonorName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [donorBalance, setDonorBalance] = useState(0);
  const [addFundsAmount, setAddFundsAmount] = useState('');
  const [withdrawFundsAmount, setWithdrawFundsAmount] = useState('');
  // Removed unused balanceHistory state to fix ESLint warning
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [addFundsSuccess, setAddFundsSuccess] = useState(false);
  const [withdrawFundsSuccess, setWithdrawFundsSuccess] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmAmount, setConfirmAmount] = useState(0);
  const [notifications, setNotifications] = useState([]);

  const MINIMUM_BALANCE = 0;

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
  
      const savedDonations = await getDonations();
      setDonations(savedDonations);
  
      const savedCampaigns = await getCampaigns();
      setCampaigns(savedCampaigns);
  
      const savedDonorBalance = await getDonorBalance();
      setDonorBalance(savedDonorBalance);
  
      // const savedBalanceHistory = await getBalanceHistory();
      // setBalanceHistory(savedBalanceHistory);
    } catch (err) {
      setError('Failed to load data. Please try again.');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    const handleStorageChange = () => loadData();
    const handleCampaignUpdate = () => {
      console.log('Custom campaign-update event triggered in DonorDashboard');
      loadData();
    };
    const handleDonationUpdate = async (e) => {
      console.log('Custom donation-update event triggered in DonorDashboard');
      await loadData();
      const savedDonations = await getDonations();
      const updatedDonation = savedDonations.find(d => d.date === e.detail?.date);
      if (updatedDonation && updatedDonation.status !== 'pending') {
        setNotifications(prev => [
          `Your donation of ₹${updatedDonation.amount} to "${updatedDonation.campaignTitle}" has been ${updatedDonation.status}!`,
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

  const updateDonationStatus = (donationId, status) => {
    const updatedDonations = donations.map(d =>
      d.id === donationId ? { ...d, status } : d
    );
    setDonations(updatedDonations);

    const savedDonations = JSON.parse(localStorage.getItem('donations')) || [];
    const updatedSavedDonations = savedDonations.map(d =>
      d.id === donationId ? { ...d, status } : d
    );
    localStorage.setItem('donations', JSON.stringify(updatedSavedDonations));

    // Dispatch events to sync other components
    const donationEvent = new CustomEvent('donation-update', { detail: { date: updatedDonations.find(d => d.id === donationId).date } });
    window.dispatchEvent(donationEvent);
    window.dispatchEvent(new Event('storage'));

    setNotifications(prev => [
      `Donation ${donationId} has been ${status}!`,
      ...prev.slice(0, 4),
    ]);
  };

  const handleAddFundsConfirmed = async () => {
    try {
      const parsedAmount = parseFloat(confirmAmount);
      const newBalance = await addFunds(donorBalance, parsedAmount);
      setDonorBalance(newBalance);
      setAddFundsSuccess(true);
      setAddFundsAmount('');
      setTimeout(() => setAddFundsSuccess(false), 3000);
      setError('');
      setShowConfirmModal(false);
      setConfirmAction(null);
      setConfirmAmount(0);
    } catch (err) {
      setError('Failed to add funds. Please try again.');
      console.error(err);
    }
  };

  const handleWithdrawFundsConfirmed = async () => {
    try {
      const parsedAmount = parseFloat(confirmAmount);
      const newBalance = await withdrawFunds(donorBalance, parsedAmount);
      setDonorBalance(newBalance);
      setWithdrawFundsSuccess(true);
      setWithdrawFundsAmount('');
      setTimeout(() => setWithdrawFundsSuccess(false), 3000);
      setError('');
      setShowConfirmModal(false);
      setConfirmAction(null);
      setConfirmAmount(0);
    } catch (err) {
      setError('Failed to withdraw funds. Please try again.');
      console.error(err);
    }
  };

  const confirmActionHandler = () => {
    if (confirmAction === 'add') {
      handleAddFundsConfirmed();
    } else if (confirmAction === 'withdraw') {
      handleWithdrawFundsConfirmed();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    if (!selectedCampaign) {
      setError('Please select a campaign to donate to');
      setLoading(false);
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      setError('Please enter a valid donation amount');
      setLoading(false);
      return;
    }

    if (parsedAmount > donorBalance) {
      setError('Insufficient balance. Please add funds to your account.');
      setLoading(false);
      return;
    }

    try {
      const campaignId = Number(selectedCampaign);
      const selectedCampaignData = campaigns.find(c => c.id === campaignId);
      if (!selectedCampaignData) {
        throw new Error('Selected campaign not found');
      }
      if (selectedCampaignData.status !== 'active') {
        throw new Error('This campaign is not active for donations.');
      }

      const donationData = {
        campaignId: campaignId,
        campaignTitle: selectedCampaignData.title,
        donorName,
        donorEmail,
        amount: parsedAmount,
        athleteId: selectedCampaignData.athleteId,
        status: 'pending', // New donations start as pending approval
      };

      const newBalance = await makeDonation(donationData, donorBalance);
      setDonorBalance(newBalance);

      setSuccess(true);
      setDonorName('');
      setDonorEmail('');
      setAmount('');
      setSelectedCampaign('');
    } catch (err) {
      console.error('Donation error:', err);
      setError(err.message || 'Donation failed');
    } finally {
      setLoading(false);
    }
  };

  // Filter pending donations for this donor by donorEmail
  // Filter pending donations for this donor by donorEmail, normalized for case and whitespace
  const normalizedDonorEmail = donorEmail.trim().toLowerCase();
  const pendingDonations = donorEmail
    ? donations.filter(d => d.status === 'pending' && d.donorEmail && d.donorEmail.trim().toLowerCase() === normalizedDonorEmail)
    : [];

  console.log('Donor Email:', donorEmail);
  console.log('Normalized Donor Email:', normalizedDonorEmail);
  console.log('Pending Donations Count:', pendingDonations.length);

  // Filter campaigns to exclude those whose goal is met by completed donations
  const activeCampaigns = campaigns.filter(c => {
    const totalCompletedDonations = donations
      .filter(d => d.campaignId === c.id && d.status === 'completed')
      .reduce((sum, d) => sum + d.amount, 0);
    // Also exclude campaigns that are not active
    return totalCompletedDonations < c.goal && c.status === 'active';
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Support Athletes</h1>

        {/* Notifications */}
        {notifications.length > 0 && (
          <div className="mb-6 space-y-2">
            {notifications.map((notification, index) => (
              <div
                key={index}
                className="bg-green-50 text-green-800 p-4 rounded-lg shadow-md flex justify-between items-center"
              >
                <span>{notification}</span>
                <button
                  onClick={() => setNotifications(prev => prev.filter((_, i) => i !== index))}
                  className="text-green-600 hover:text-green-800"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Confirmation Modal */}
        {showConfirmModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Confirm {confirmAction === 'add' ? 'Add Funds' : 'Withdraw Funds'}
              </h3>
              <p className="text-gray-600 mb-4">
                Are you sure you want to {confirmAction === 'add' ? 'add' : 'withdraw'}{' '}
                <span className="font-bold">₹{confirmAmount}</span>{' '}
                {confirmAction === 'add' ? 'to' : 'from'} your balance?
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowConfirmModal(false);
                    setConfirmAction(null);
                    setConfirmAmount(0);
                  }}
                  className="py-2 px-4 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmActionHandler}
                  className={`py-2 px-4 text-white rounded-lg transition-all duration-300 ${
                    confirmAction === 'add'
                      ? 'bg-green-500 hover:bg-green-600'
                      : 'bg-red-500 hover:bg-red-600'
                  }`}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-8">
            <svg
              className="animate-spin h-8 w-8 mx-auto text-indigo-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
        )}

        {!loading && (
          <>
            {/* Display Donor Balance and Add/Withdraw Funds */}
            <div className="bg-white/30 backdrop-blur-lg rounded-2xl shadow-xl p-6 mb-8 border border-white/20">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Your Balance</h2>
              <p className="text-3xl font-bold text-indigo-700 mb-4">${donorBalance.toLocaleString()}</p>
              <div className="flex space-x-4">
                <div className="flex-1">
                  <input
                    type="number"
                    min="1"
                    value={addFundsAmount}
                    onChange={(e) => setAddFundsAmount(e.target.value)}
                    placeholder="Add funds amount"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition"
                  />
                  <button
                    disabled={!addFundsAmount || isNaN(addFundsAmount) || addFundsAmount <= 0}
                    onClick={() => {
                      setConfirmAction('add');
                      setConfirmAmount(addFundsAmount);
                      setShowConfirmModal(true);
                    }}
                    className="mt-2 w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                  >
                    Add Funds
                  </button>
                  {addFundsSuccess && (
                    <p className="mt-2 text-green-600 font-semibold">Funds added successfully!</p>
                  )}
                </div>
                <div className="flex-1">
                  <input
                    type="number"
                    min="1"
                    value={withdrawFundsAmount}
                    onChange={(e) => setWithdrawFundsAmount(e.target.value)}
                    placeholder="Withdraw funds amount"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition"
                  />
                  <button
                    disabled={
                      !withdrawFundsAmount ||
                      isNaN(withdrawFundsAmount) ||
                      withdrawFundsAmount <= 0 ||
                      withdrawFundsAmount > donorBalance
                    }
                    onClick={() => {
                      setConfirmAction('withdraw');
                      setConfirmAmount(withdrawFundsAmount);
                      setShowConfirmModal(true);
                    }}
                    className="mt-2 w-full py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                  >
                    Withdraw Funds
                  </button>
                  {withdrawFundsSuccess && (
                    <p className="mt-2 text-red-600 font-semibold">Funds withdrawn successfully!</p>
                  )}
                </div>
              </div>
            </div>

            {/* Donation Form */}
            <form onSubmit={handleSubmit} className="bg-white/30 backdrop-blur-lg rounded-2xl shadow-xl p-6 mb-8 border border-white/20">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Make a Donation</h2>
              {error && <p className="text-red-600 mb-4">{error}</p>}
              {success && <p className="text-green-600 mb-4">Donation successful!</p>}
              <div className="mb-4">
                <label htmlFor="donorName" className="block mb-1 font-semibold text-gray-700">Name</label>
                <input
                  id="donorName"
                  type="text"
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition"
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="donorEmail" className="block mb-1 font-semibold text-gray-700">Email</label>
                <input
                  id="donorEmail"
                  type="email"
                  value={donorEmail}
                  onChange={(e) => setDonorEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition"
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="selectedCampaign" className="block mb-1 font-semibold text-gray-700">Select Campaign</label>
                <select
                  id="selectedCampaign"
                  value={selectedCampaign}
                  onChange={(e) => setSelectedCampaign(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition"
                  required
                >
                  <option value="">-- Select a campaign --</option>
                  {activeCampaigns.map(campaign => (
                    <option key={campaign.id} value={campaign.id}>
                      {campaign.title} (Goal: ${campaign.goal.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label htmlFor="amount" className="block mb-1 font-semibold text-gray-700">Amount</label>
                <input
                  id="amount"
                  type="number"
                  min="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                Donate
              </button>
            </form>

            {/* Pending Donations Approval Section removed as per user request */}

            {/* Donation History */}
            <div className="bg-white/30 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-white/20 mt-8">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Donation History</h2>
              {donations.length === 0 ? (
                <p className="text-gray-600">No donations yet.</p>
              ) : (
                <ul className="space-y-4 max-h-96 overflow-y-auto">
                  {donations.map(donation => (
                    <li key={donation.id} className="p-4 bg-white rounded-lg shadow-md">
                      <p className="font-semibold text-gray-800">{donation.donorName} donated ${donation.amount.toLocaleString()}</p>
                      <p className="text-gray-600 text-sm">{donation.campaignTitle}</p>
                      <p className="text-gray-500 text-xs">{new Date(donation.date).toLocaleString()}</p>
                      <p className={`text-sm font-medium ${
                        donation.status === 'completed' ? 'text-green-600' :
                        donation.status === 'pending' ? 'text-yellow-600' : 'text-red-600'
                      }`}>{donation.status}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DonorDashboard;
