export function seedLocalStorageKeys() {
  const keysToCheck = ['campaigns', 'donations', 'adminData'];

  keysToCheck.forEach(key => {
    try {
      const item = localStorage.getItem(key);
      if (!item) {
        if (key === 'adminData') {
          // Seed default adminData with athletes array including athlete with id=1
          const defaultAdminData = {
            athletes: [
              {
                id: 1,
                name: 'Default Athlete',
                email: 'athlete@example.com',
                joined: new Date().toISOString(),
                campaigns: 0,
                totalRaised: 0,
              }
            ],
            campaigns: [],
            donations: [],
          };
          localStorage.setItem(key, JSON.stringify(defaultAdminData));
        } else {
          localStorage.setItem(key, JSON.stringify([]));
        }
      } else {
        // Check if valid JSON array or object
        const parsed = JSON.parse(item);
        if (key === 'adminData') {
          if (typeof parsed !== 'object' || parsed === null) {
            const defaultAdminData = {
              athletes: [
                {
                  id: 1,
                  name: 'Default Athlete',
                  email: 'athlete@example.com',
                  joined: new Date().toISOString(),
                  campaigns: 0,
                  totalRaised: 0,
                }
              ],
              campaigns: [],
              donations: [],
            };
            localStorage.setItem(key, JSON.stringify(defaultAdminData));
          }
        } else {
          if (!Array.isArray(parsed)) {
            localStorage.setItem(key, JSON.stringify([]));
          }
        }
      }
    } catch {
      // If JSON parse error, reset to empty array or default object
      if (key === 'adminData') {
        const defaultAdminData = {
          athletes: [
            {
              id: 1,
              name: 'Default Athlete',
              email: 'athlete@example.com',
              joined: new Date().toISOString(),
              campaigns: 0,
              totalRaised: 0,
            }
          ],
          campaigns: [],
          donations: [],
        };
        localStorage.setItem(key, JSON.stringify(defaultAdminData));
      } else {
        localStorage.setItem(key, JSON.stringify([]));
      }
    }
  });
}
