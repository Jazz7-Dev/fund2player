import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

const getMockData = () => {
  const stored = localStorage.getItem('adminData');
  if (stored) return JSON.parse(stored);

  const data = {
    athletes: [
      { id: 1, name: "Michael Phelps", email: "michael@example.com", joined: "2023-01-15", campaigns: 3, totalRaised: 24500 },
      { id: 2, name: "Simone Biles", email: "simone@example.com", joined: "2023-02-20", campaigns: 2, totalRaised: 18200 },
      { id: 3, name: "Katie Ledecky", email: "katie@example.com", joined: "2023-03-10", campaigns: 4, totalRaised: 31500 },
      { id: 4, name: "Usain Bolt", email: "usain@example.com", joined: "2023-04-05", campaigns: 1, totalRaised: 8500 },
      { id: 5, name: "Serena Williams", email: "serena@example.com", joined: "2023-05-15", campaigns: 5, totalRaised: 42750 }
    ],
    transactions: [],
    campaigns: [],
  };

  localStorage.setItem('adminData', JSON.stringify(data));
  return data;
};

export default function AdminDashboard() {
  const [data, setData] = useState({ athletes: [], transactions: [], campaigns: [] });
  const [selectedTab, setSelectedTab] = useState('transactions');
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(() => {
    try {
      setLoading(true);
      setError('');

      const adminData = getMockData();
      const savedCampaigns = JSON.parse(localStorage.getItem('campaigns')) || [];
      adminData.campaigns = savedCampaigns;

      const savedDonations = JSON.parse(localStorage.getItem('donations')) || [];
      const adminTransactions = adminData.transactions;
      savedDonations.forEach(donation => {
        if (!adminTransactions.some(t => t.id === donation.id)) {
          adminTransactions.push({
            id: donation.id,
            donor: donation.donorName,
            amount: donation.amount,
            date: donation.date,
            athleteId: donation.athleteId,
            status: donation.status,
          });
        } else {
          const existingTransaction = adminTransactions.find(t => t.id === donation.id);
          if (existingTransaction) {
            existingTransaction.status = donation.status; // Sync status
          }
        }
      });
      adminData.transactions = adminTransactions;

      // Recalculate totalRaised for athletes based on completed transactions
      const updatedAthletes = adminData.athletes.map(athlete => {
        const athleteTransactions = adminTransactions.filter(
          t => t.athleteId === athlete.id && t.status === 'completed'
        );
        const totalRaised = athleteTransactions.reduce((sum, t) => sum + t.amount, 0);
        return { ...athlete, totalRaised };
      });
      adminData.athletes = updatedAthletes;

      setData(adminData);
      localStorage.setItem('adminData', JSON.stringify(adminData));
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
      console.log('Custom campaign-update event triggered in AdminDashboard');
      loadData();
    };
    const handleDonationUpdate = (e) => {
      console.log('Custom donation-update event triggered in AdminDashboard');
      loadData();
      const savedDonations = JSON.parse(localStorage.getItem('donations')) || [];
      const newDonation = savedDonations.find(d => d.date === e.detail?.date);
      if (newDonation) {
        setNotifications(prev => [
          `New donation of $${newDonation.amount} by ${newDonation.donorName} to campaign ID ${newDonation.campaignId}!`,
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

  const updateTransactionStatus = (transactionId, status) => {
    const updatedTransactions = data.transactions.map(t => 
      t.id === transactionId ? { ...t, status } : t
    );

    const savedDonations = JSON.parse(localStorage.getItem('donations')) || [];
    const updatedDonations = savedDonations.map(d => 
      d.id === transactionId ? { ...d, status } : d
    );
    localStorage.setItem('donations', JSON.stringify(updatedDonations));

    const updatedAthletes = data.athletes.map(a => {
      const transaction = updatedTransactions.find(t => t.id === transactionId);
      if (a.id === transaction.athleteId && status === 'completed') {
        return { ...a, totalRaised: a.totalRaised + transaction.amount };
      } else if (a.id === transaction.athleteId && status === 'rejected') {
        return { ...a, totalRaised: Math.max(0, a.totalRaised - transaction.amount) };
      }
      return a;
    });

    const newData = { ...data, transactions: updatedTransactions, athletes: updatedAthletes };
    setData(newData);
    localStorage.setItem('adminData', JSON.stringify(newData));

    const donationEvent = new CustomEvent('donation-update', { detail: { date: updatedTransactions.find(t => t.id === transactionId).date } });
    window.dispatchEvent(donationEvent);
    window.dispatchEvent(new Event('storage'));

    setNotifications(prev => [
      `Transaction ${transactionId} has been ${status}!`,
      ...prev.slice(0, 4),
    ]);
  };

  const updateCampaignStatus = (campaignId, status) => {
    const updatedCampaigns = data.campaigns.map(c =>
      c.id === campaignId ? { ...c, status } : c
    );
    setData(prev => ({ ...prev, campaigns: updatedCampaigns }));
    localStorage.setItem('campaigns', JSON.stringify(updatedCampaigns));
    localStorage.setItem('adminData', JSON.stringify({ ...data, campaigns: updatedCampaigns }));

    window.dispatchEvent(new Event('campaign-update'));
    window.dispatchEvent(new Event('storage'));
  };

  // Monthly Donations Chart Data
  const monthlyDonations = useMemo(() => {
    const months = { 'Jan': 0, 'Feb': 0, 'Mar': 0, 'Apr': 0, 'May': 0, 'Jun': 0 };
    data.transactions.forEach(transaction => {
      const month = new Date(transaction.date).toLocaleString('default', { month: 'short' });
      if (Object.prototype.hasOwnProperty.call(months, month)) {
        months[month] += transaction.amount;
      }
    });
    return months;
  }, [data.transactions]);

  const chartData = {
    labels: Object.keys(monthlyDonations),
    datasets: [{
      label: 'Donations',
      data: Object.values(monthlyDonations),
      borderColor: 'rgb(79, 70, 229)',
      backgroundColor: 'rgba(79, 70, 229, 0.1)',
      fill: true,
      tension: 0.3,
    }],
  };

  // Per-Athlete Donations Chart Data
  const perAthleteDonations = useMemo(() => {
    const datasets = data.athletes.map((athlete, index) => {
      const months = { 'Jan': 0, 'Feb': 0, 'Mar': 0, 'Apr': 0, 'May': 0, 'Jun': 0 };
      const athleteTransactions = data.transactions.filter(t => t.athleteId === athlete.id && t.status === 'completed');
      athleteTransactions.forEach(t => {
        const month = new Date(t.date).toLocaleString('default', { month: 'short' });
        if (Object.prototype.hasOwnProperty.call(months, month)) {
          months[month] += t.amount;
        }
      });
      return {
        label: athlete.name,
        data: Object.values(months),
        borderColor: `hsl(${(index * 60) % 360}, 70%, 50%)`,
        backgroundColor: `hsla(${(index * 60) % 360}, 70%, 50%, 0.1)`,
        fill: true,
        tension: 0.3,
      };
    });
    return {
      labels: Object.keys(monthlyDonations),
      datasets,
    };
  }, [data.athletes, data.transactions]);

  const filteredTransactions = data.transactions.filter(t =>
    t.donor.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.athleteId.toString().includes(searchQuery)
  );

  const filteredAthletes = data.athletes.filter(a =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6 lg:p-10">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-extrabold text-gray-800 mb-8 tracking-tight">
          Admin Dashboard
        </h1>

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

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 text-red-800 p-4 rounded-lg shadow-md">
            {error}
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
            {/* Navigation Tabs */}
            <div className="flex space-x-2 mb-8 border-b-2 border-gray-200">
              {['transactions', 'athletes', 'campaigns', 'analytics'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSelectedTab(tab)}
                  className={`px-6 py-3 text-base font-semibold rounded-t-lg transition-all duration-300 ${
                    selectedTab === tab
                      ? 'bg-white text-indigo-600 border-b-4 border-indigo-500'
                      : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* Search Bar */}
            <div className="mb-8">
              <div className="relative max-w-md">
                <input
                  type="text"
                  placeholder="Search by donor, athlete, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-5 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-500 transition-all duration-300"
                />
                <svg
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>

            {/* Transactions Tab */}
            {selectedTab === 'transactions' && (
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-indigo-50">
                    <tr>
                      {['Donor', 'Amount', 'Athlete', 'Date', 'Status', 'Actions'].map((header) => (
                        <th
                          key={header}
                          className="px-6 py-4 text-left text-sm font-semibold text-indigo-700 uppercase tracking-wider"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredTransactions.map((transaction) => {
                      const athlete = data.athletes.find(a => a.id === transaction.athleteId);
                      return (
                        <tr
                          key={transaction.id}
                          className="hover:bg-gray-50 transition-colors duration-200"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-gray-800 font-medium">
                            {transaction.donor}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-800">
                            ${transaction.amount.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-800">
                            {athlete?.name || 'Unknown'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                            {new Date(transaction.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-3 py-1 text-sm font-medium rounded-full ${
                                transaction.status === 'completed'
                                  ? 'bg-green-100 text-green-700'
                                  : transaction.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {transaction.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {transaction.status === 'pending' && (
                              <div className="flex space-x-3">
                                <button
                                  onClick={() => updateTransactionStatus(transaction.id, 'completed')}
                                  className="text-green-600 hover:text-green-800 font-medium transition-colors duration-200"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => updateTransactionStatus(transaction.id, 'rejected')}
                                  className="text-red-600 hover:text-red-800 font-medium transition-colors duration-200"
                                >
                                  Reject
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {filteredTransactions.length === 0 && (
                  <p className="text-center py-8 text-gray-500">No transactions found.</p>
                )}
              </div>
            )}

            {/* Athletes Tab */}
            {selectedTab === 'athletes' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAthletes.map((athlete) => (
                  <div
                    key={athlete.id}
                    className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
                  >
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center">
                        <span className="text-indigo-600 text-lg font-semibold">
                          {athlete.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-800">{athlete.name}</h2>
                        <p className="text-sm text-gray-500">{athlete.email}</p>
                      </div>
                    </div>
                    <div className="space-y-3 text-gray-600">
                      <p className="text-sm">
                        <span className="font-semibold text-gray-700">Joined:</span>{" "}
                        {new Date(athlete.joined).toLocaleDateString()}
                      </p>
                      <p className="text-sm">
                        <span className="font-semibold text-gray-700">Campaigns:</span>{" "}
                        {athlete.campaigns}
                      </p>
                      <p className="text-sm">
                        <span className="font-semibold text-gray-700">Total Raised:</span>{" "}
                        <span className="text-indigo-600 font-medium">
                          ${athlete.totalRaised.toLocaleString()}
                        </span>
                      </p>
                    </div>
                  </div>
                ))}
                {filteredAthletes.length === 0 && (
                  <p className="col-span-full text-center py-8 text-gray-500">No athletes found.</p>
                )}
              </div>
            )}

            {/* Campaigns Tab */}
            {selectedTab === 'campaigns' && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Campaigns</h2>
                {data.campaigns.length === 0 ? (
                  <p className="text-center py-8 text-gray-500">No campaigns found.</p>
                ) : (
                  <div className="space-y-4">
                    {data.campaigns.map((campaign) => {
                      const athlete = data.athletes.find(a => a.id === campaign.athleteId);
                      return (
                        <div
                          key={campaign.id}
                          className="bg-gray-50 p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200"
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <h3 className="font-semibold text-gray-800">{campaign.title}</h3>
                              <p className="text-sm text-gray-600">
                                Athlete: {athlete?.name || 'Unknown'}
                              </p>
                              <p className="text-sm text-gray-600">
                                Goal: ${campaign.goal.toLocaleString()} | Raised: ${(campaign.fundsRaised || 0).toLocaleString()}
                              </p>
                              <p className="text-sm text-gray-600">Status: {campaign.status}</p>
                            </div>
                            <div className="flex space-x-2">
                              {campaign.status === 'active' && (
                                <button
                                  onClick={() => updateCampaignStatus(campaign.id, 'completed')}
                                  className="text-green-600 hover:text-green-800 font-medium"
                                >
                                  Mark as Completed
                                </button>
                              )}
                              {campaign.status === 'pending' && (
                                <button
                                  onClick={() => updateCampaignStatus(campaign.id, 'active')}
                                  className="text-blue-600 hover:text-blue-800 font-medium"
                                >
                                  Activate
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Analytics Tab */}
            {selectedTab === 'analytics' && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Donation Analytics</h2>
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-700 mb-4">Total Donations Over Time</h3>
                  <div className="h-96">
                    <Line
                      data={chartData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { position: 'top', labels: { font: { size: 14 }, color: '#374151' } },
                          tooltip: {
                            mode: 'index',
                            intersect: false,
                            backgroundColor: 'rgba(55, 65, 81, 0.9)',
                            titleFont: { size: 14 },
                            bodyFont: { size: 12 },
                          },
                        },
                        scales: {
                          x: { ticks: { color: '#4B5563' }, grid: { display: false } },
                          y: { ticks: { color: '#4B5563' }, grid: { color: '#E5E7EB' } },
                        },
                        hover: { mode: 'nearest', intersect: true },
                      }}
                    />
                  </div>
                </div>

                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-700 mb-4">Donations Per Athlete</h3>
                  <div className="h-96">
                    <Line
                      data={perAthleteDonations}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { position: 'top', labels: { font: { size: 14 }, color: '#374151' } },
                          tooltip: {
                            mode: 'index',
                            intersect: false,
                            backgroundColor: 'rgba(55, 65, 81, 0.9)',
                            titleFont: { size: 14 },
                            bodyFont: { size: 12 },
                          },
                        },
                        scales: {
                          x: { ticks: { color: '#4B5563' }, grid: { display: false } },
                          y: { ticks: { color: '#4B5563' }, grid: { color: '#E5E7EB' } },
                        },
                        hover: { mode: 'nearest', intersect: true },
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-indigo-50 p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300">
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Donations</h3>
                    <p className="text-3xl font-bold text-indigo-600">
                      ${data.transactions.reduce((sum, t) => sum + (t.status === 'completed' ? t.amount : 0), 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-green-50 p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300">
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Active Campaigns</h3>
                    <p className="text-3xl font-bold text-green-600">
                      {data.campaigns.filter(c => c.status === 'active').length}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}