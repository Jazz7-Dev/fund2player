import React, { useState, useEffect, useCallback } from 'react';

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
  const [balanceHistory, setBalanceHistory] = useState([]);
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

  const loadData = useCallback(() => {
    try {
      setLoading(true);
      setError('');

      // Load donations
      const savedDonations = JSON.parse(localStorage.getItem('donations')) || [];
      setDonations(savedDonations);

      // Load campaigns
      const savedCampaigns = JSON.parse(localStorage.getItem('campaigns')) || [];
      setCampaigns(savedCampaigns);

      // Load donor balance
      const savedDonor = JSON.parse(localStorage.getItem('donor')) || { balance: 10000 };
      setDonorBalance(savedDonor.balance);

      // Load balance history
      const savedBalanceHistory = JSON.parse(localStorage.getItem('balanceHistory')) || [];
      setBalanceHistory(savedBalanceHistory);
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
    const handleDonationUpdate = (e) => {
      console.log('Custom donation-update event triggered in DonorDashboard');
      loadData();
      // Add notification for donation status updates
      const savedDonations = JSON.parse(localStorage.getItem('donations')) || [];
      const updatedDonation = savedDonations.find(d => d.date === e.detail?.date);
      if (updatedDonation && updatedDonation.status !== 'pending') {
        setNotifications(prev => [
          `Your donation of $${updatedDonation.amount} to "${updatedDonation.campaignTitle}" has been ${updatedDonation.status}!`,
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

  const updateCampaignFunds = (campaignId, donationAmount) => {
    const parsedAmount = parseFloat(donationAmount);
    const updatedCampaigns = campaigns.map(c =>
      c.id === campaignId ? { ...c, fundsRaised: (c.fundsRaised || 0) + parsedAmount } : c
    );
    setCampaigns(updatedCampaigns);
    localStorage.setItem('campaigns', JSON.stringify(updatedCampaigns));
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('campaign-update'));
  };

  const updateDonorBalance = (newBalance, action, amount) => {
    setDonorBalance(newBalance);
    localStorage.setItem('donor', JSON.stringify({ balance: newBalance }));

    const newHistoryEntry = {
      id: Date.now(),
      action,
      amount: parseFloat(amount),
      balanceAfter: newBalance,
      date: new Date().toISOString(),
    };
    const updatedHistory = [newHistoryEntry, ...balanceHistory].slice(0, 50);
    setBalanceHistory(updatedHistory);
    localStorage.setItem('balanceHistory', JSON.stringify(updatedHistory));
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
      window.dispatchEvent(new Event('campaign-update'));
    } catch (err) {
      console.error('Error logging activity:', err);
    }
  };

  const handleAddFunds = () => {
    const parsedAddAmount = parseFloat(addFundsAmount);
    if (!parsedAddAmount || parsedAddAmount <= 0) {
      setError('Please enter a valid amount to add');
      return;
    }
    setConfirmAction('add');
    setConfirmAmount(parsedAddAmount);
    setShowConfirmModal(true);
  };

  const handleWithdrawFunds = () => {
    const parsedWithdrawAmount = parseFloat(withdrawFundsAmount);
    if (!parsedWithdrawAmount || parsedWithdrawAmount <= 0) {
      setError('Please enter a valid amount to withdraw');
      return;
    }
    if (parsedWithdrawAmount > donorBalance) {
      setError('Cannot withdraw more than your current balance');
      return;
    }
    if (donorBalance - parsedWithdrawAmount < MINIMUM_BALANCE) {
      setError(`Cannot withdraw below the minimum balance of $${MINIMUM_BALANCE}`);
      return;
    }
    setConfirmAction('withdraw');
    setConfirmAmount(parsedWithdrawAmount);
    setShowConfirmModal(true);
  };

  const confirmActionHandler = () => {
    if (confirmAction === 'add') {
      const newBalance = donorBalance + confirmAmount;
      updateDonorBalance(newBalance, 'Added Funds', confirmAmount);
      logActivity(`Added $${confirmAmount} to balance`, confirmAmount);
      setAddFundsSuccess(true);
      setAddFundsAmount('');
      setTimeout(() => setAddFundsSuccess(false), 3000);
    } else if (confirmAction === 'withdraw') {
      const newBalance = donorBalance - confirmAmount;
      updateDonorBalance(newBalance, 'Withdrew Funds', confirmAmount);
      logActivity(`Withdrew $${confirmAmount} from balance`, -confirmAmount);
      setWithdrawFundsSuccess(true);
      setWithdrawFundsAmount('');
      setTimeout(() => setWithdrawFundsSuccess(false), 3000);
    }
    setError('');
    setShowConfirmModal(false);
    setConfirmAction(null);
    setConfirmAmount(0);
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

      const campaignTitle = selectedCampaignData.title;
      const newBalance = donorBalance - parsedAmount;
      updateDonorBalance(newBalance, `Donation to "${campaignTitle}"`, parsedAmount);

      const newDonation = {
        id: Date.now(),
        campaignId: campaignId,
        campaignTitle,
        donorName,
        donorEmail,
        amount: parsedAmount,
        date: new Date().toISOString(),
        status: 'pending',
        athleteId: selectedCampaignData.athleteId,
      };

      const updatedDonations = [newDonation, ...donations];
      setDonations(updatedDonations);
      localStorage.setItem('donations', JSON.stringify(updatedDonations));

      const adminData = JSON.parse(localStorage.getItem('adminData')) || { transactions: [] };
      const newTransaction = {
        id: newDonation.id,
        donor: donorName,
        amount: parsedAmount,
        date: newDonation.date,
        athleteId: selectedCampaignData.athleteId,
        status: 'pending',
      };
      adminData.transactions = [newTransaction, ...adminData.transactions];
      localStorage.setItem('adminData', JSON.stringify(adminData));

      updateCampaignFunds(campaignId, parsedAmount);
      logActivity(`Donation to "${campaignTitle}" by ${donorName}`, parsedAmount);

      const donationEvent = new CustomEvent('donation-update', { detail: { date: newDonation.date } });
      window.dispatchEvent(donationEvent);
      window.dispatchEvent(new Event('storage'));

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
                <span className="font-bold">${confirmAmount}</span>{' '}
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
              <p className="text-lg text-gray-700">
                Available Balance: <span className="font-bold text-blue-600">${donorBalance}</span>
              </p>
              <div className="mt-4 space-y-4">
                <div className="flex items-center space-x-4">
                  <input
                    type="number"
                    value={addFundsAmount}
                    onChange={(e) => setAddFundsAmount(e.target.value)}
                    className="w-32 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Add Funds ($)"
                    min="1"
                  />
                  <button
                    onClick={handleAddFunds}
                    className="py-2 px-4 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition-all duration-300"
                  >
                    Add Funds
                  </button>
                </div>
                {addFundsSuccess && (
                  <div className="text-green-600 text-sm p-2 rounded bg-green-50 flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-2"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Funds added successfully! 🎉
                  </div>
                )}
                <div className="flex items-center space-x-4">
                  <input
                    type="number"
                    value={withdrawFundsAmount}
                    onChange={(e) => setWithdrawFundsAmount(e.target.value)}
                    className="w-32 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Withdraw Funds ($)"
                    min="1"
                  />
                  <button
                    onClick={handleWithdrawFunds}
                    className="py-2 px-4 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-all duration-300"
                  >
                    Withdraw Funds
                  </button>
                </div>
                {withdrawFundsSuccess && (
                  <div className="text-green-600 text-sm p-2 rounded bg-green-50 flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-2"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Funds withdrawn successfully! 🎉
                  </div>
                )}
              </div>
            </div>

            {/* Balance History */}
            <div className="bg-white/30 backdrop-blur-lg rounded-2xl shadow-xl p-6 mb-8 border border-white/20">
              <h2 className="text-xl font-semibold mb-6 text-gray-800">Balance History</h2>
              {balanceHistory.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No balance changes yet.</p>
              ) : (
                <div className="space-y-4">
                  {balanceHistory.map((entry) => (
                    <div
                      key={entry.id}
                      className="bg-white/50 p-4 rounded-lg border border-white/20 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-semibold text-gray-800">{entry.action}</h3>
                          <p className="text-sm text-gray-600">
                            {new Date(entry.date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p
                            className={`font-bold ${
                              entry.action.includes('Withdrew') || entry.action.includes('Donation')
                                ? 'text-red-600'
                                : 'text-green-600'
                            }`}
                          >
                            {entry.action.includes('Withdrew') || entry.action.includes('Donation')
                              ? '-'
                              : '+'}
                            ${Math.abs(entry.amount)}
                          </p>
                          <p className="text-xs text-gray-500">Balance: ${entry.balanceAfter}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Donation Form */}
            <div className="bg-white/30 backdrop-blur-lg rounded-2xl shadow-xl p-6 mb-8 border border-white/20">
              <h2 className="text-xl font-semibold mb-6 text-gray-800">Make a Donation</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="relative group">
                  <select
                    value={selectedCampaign}
                    onChange={(e) => setSelectedCampaign(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select a Campaign</option>
                    {campaigns.map(campaign => (
                      <option key={campaign.id} value={campaign.id}>
                        {campaign.title} (Goal: ${campaign.goal}, Raised: ${(campaign.fundsRaised || 0).toLocaleString()}, Status: {campaign.status})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="relative group">
                    <input
                      type="text"
                      value={donorName}
                      onChange={(e) => setDonorName(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Your Name"
                      required
                    />
                  </div>
                  <div className="relative group">
                    <input
                      type="email"
                      value={donorEmail}
                      onChange={(e) => setDonorEmail(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Your Email"
                      required
                    />
                  </div>
                </div>
                <div className="relative group">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Amount ($)"
                    min="1"
                    required
                  />
                </div>
                {error && <div className="text-red-600 text-sm p-2 rounded bg-red-50">{error}</div>}
                {success && (
                  <div className="text-green-600 text-sm p-2 rounded bg-green-50 flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-2"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Donation successful! Thank you! 🎉
                  </div>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 disabled:opacity-50"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    'Donate Now'
                  )}
                </button>
              </form>
            </div>

            {/* Recent Donations */}
            <div className="bg-white/30 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-white/20">
              <h2 className="text-xl font-semibold mb-6 text-gray-800">Recent Donations</h2>
              {donations.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No donations yet. Be the first to support! ❤️</p>
              ) : (
                <div className="space-y-4">
                  {donations.map((donation) => (
                    <div
                      key={donation.id}
                      className="bg-white/50 p-4 rounded-lg border border-white/20 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-semibold text-gray-800">{donation.donorName}</h3>
                          <p className="text-sm text-gray-600">{donation.donorEmail}</p>
                          <p className="text-sm text-gray-600">Campaign: {donation.campaignTitle}</p>
                          <p className="text-sm text-gray-600">Status: {donation.status}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-blue-600">${donation.amount}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(donation.date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
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
      </div>
    </div>
  );
};

export default DonorDashboard;