const STORAGE_KEYS = {
  donations: 'donations',
  campaigns: 'campaigns',
  donor: 'donor',
  balanceHistory: 'balanceHistory',
  activities: 'activities',
  adminData: 'adminData',
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const getDonations = async () => {
  await delay(300);
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.donations)) || [];
};

const getCampaigns = async () => {
  await delay(300);
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.campaigns)) || [];
};

const getDonorBalance = async () => {
  await delay(200);
  const donor = JSON.parse(localStorage.getItem(STORAGE_KEYS.donor));
  return donor ? donor.balance : 10000;
};

const getBalanceHistory = async () => {
  await delay(200);
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.balanceHistory)) || [];
};

const getActivities = async () => {
  await delay(200);
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.activities)) || [];
};

const getAdminData = async () => {
  await delay(200);
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.adminData)) || { transactions: [] };
};

const updateCampaigns = async (campaigns) => {
  await delay(200);
  localStorage.setItem(STORAGE_KEYS.campaigns, JSON.stringify(campaigns));
  window.dispatchEvent(new Event('storage'));
  window.dispatchEvent(new Event('campaign-update'));
};

const updateDonations = async (donations) => {
  await delay(200);
  localStorage.setItem(STORAGE_KEYS.donations, JSON.stringify(donations));
  window.dispatchEvent(new Event('storage'));
  window.dispatchEvent(new Event('donation-update'));
};

const updateDonor = async (balance) => {
  await delay(200);
  localStorage.setItem(STORAGE_KEYS.donor, JSON.stringify({ balance }));
};

const updateBalanceHistory = async (history) => {
  await delay(200);
  localStorage.setItem(STORAGE_KEYS.balanceHistory, JSON.stringify(history));
};

const updateActivities = async (activities) => {
  await delay(200);
  localStorage.setItem(STORAGE_KEYS.activities, JSON.stringify(activities));
  window.dispatchEvent(new Event('storage'));
  window.dispatchEvent(new Event('campaign-update'));
};

const updateAdminData = async (adminData) => {
  await delay(200);
  localStorage.setItem(STORAGE_KEYS.adminData, JSON.stringify(adminData));
};

const addFunds = async (currentBalance, amount) => {
  const newBalance = currentBalance + amount;
  await updateDonor(newBalance);

  const activities = await getActivities();
  activities.unshift({
    message: `Added $${amount} to balance`,
    timeAgo: new Date().toLocaleString(),
    amount,
  });
  await updateActivities(activities.slice(0, 10));

  const balanceHistory = await getBalanceHistory();
  balanceHistory.unshift({
    id: Date.now(),
    action: 'Added Funds',
    amount,
    balanceAfter: newBalance,
    date: new Date().toISOString(),
  });
  await updateBalanceHistory(balanceHistory.slice(0, 50));

  return newBalance;
};

const withdrawFunds = async (currentBalance, amount) => {
  const newBalance = currentBalance - amount;
  await updateDonor(newBalance);

  const activities = await getActivities();
  activities.unshift({
    message: `Withdrew $${amount} from balance`,
    timeAgo: new Date().toLocaleString(),
    amount: -amount,
  });
  await updateActivities(activities.slice(0, 10));

  const balanceHistory = await getBalanceHistory();
  balanceHistory.unshift({
    id: Date.now(),
    action: 'Withdrew Funds',
    amount,
    balanceAfter: newBalance,
    date: new Date().toISOString(),
  });
  await updateBalanceHistory(balanceHistory.slice(0, 50));

  return newBalance;
};

const makeDonation = async (donationData, currentBalance) => {
  const donations = await getDonations();
  const campaigns = await getCampaigns();
  const adminData = await getAdminData();

  const newDonation = {
    id: Date.now(),
    ...donationData,
    date: new Date().toISOString(),
    status: 'pending',
  };

  donations.unshift(newDonation);
  await updateDonations(donations);

  const campaignIndex = campaigns.findIndex(c => c.id === donationData.campaignId);
  if (campaignIndex !== -1) {
    campaigns[campaignIndex].fundsRaised = (campaigns[campaignIndex].fundsRaised || 0) + donationData.amount;
    await updateCampaigns(campaigns);
  }

  const newBalance = currentBalance - donationData.amount;
  await updateDonor(newBalance);

  if (!Array.isArray(adminData.transactions)) {
    adminData.transactions = [];
  }

  const newTransaction = {
    id: newDonation.id,
    donor: donationData.donorName,
    amount: donationData.amount,
    date: newDonation.date,
    athleteId: campaigns[campaignIndex]?.athleteId,
    status: 'pending',
  };
  adminData.transactions.unshift(newTransaction);
  await updateAdminData(adminData);

  const activities = await getActivities();
  activities.unshift({
    message: `Donation to "${donationData.campaignTitle}" by ${donationData.donorName}`,
    timeAgo: new Date().toLocaleString(),
    amount: donationData.amount,
  });
  await updateActivities(activities.slice(0, 10));

  window.dispatchEvent(new CustomEvent('donation-update', { detail: { date: newDonation.date } }));
  window.dispatchEvent(new Event('storage'));

  return newBalance;
};

export {
  getDonations,
  getCampaigns,
  getDonorBalance,
  getBalanceHistory,
  addFunds,
  withdrawFunds,
  makeDonation,
};
