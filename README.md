# fund2player

> **Funding App for Underprivileged Athletes**

## 🔗 Live Demo

> *(No live demo yet; uses a fake/dummy backend for demonstration.)*

## 📝 Description

fund2player is designed to streamline donations to underprivileged athletes. Donors can log in to contribute funds, and athletes can track their funding. An admin panel allows for overall management of users and transactions. This demo uses a dummy backend for simplicity.

## 🚀 Project Overview

* **Donor Portal**: Donors log in and make contributions.
* **Athlete Portal**: Athletes log in to view received funds and funding history.
* **Admin Panel**: Admin can oversee donors and athletes, approving or rejecting funding.
* **Authentication**: Email/password login with role-based access (donor, athlete, admin).

> **Test Credentials:**
>
> * **Donor:** [donor@example.com](mailto:donor@example.com) / donor123
> * **Athlete:** [athlete@example.com](mailto:athlete@example.com) / athlete123
> * **Admin:** [admin@example.com](mailto:admin@example.com) / admin123

## 🧰 Tech Stack

* **Frontend:** React, Tailwind CSS
* **Backend:** Node.js, Express.js (Fake/Dummy data)
* **Authentication:** JSON Web Tokens (JWT) for session management
* **Routing:** React Router DOM
* **State Management:** React Context API / useState

## 📂 Project Structure

```
fund2player/
├── client/                  # React frontend
│   ├── public/
│   └── src/
│       ├── components/      # Reusable UI components
│       ├── pages/           # Donor, Athlete, Admin pages
│       ├── context/         # Authentication context
│       ├── services/        # API service modules
│       └── App.js
└── server/                  # Dummy backend
    ├── data/                # JSON files for fake data
    ├── routes/              # Auth & funding routes
    └── server.js            # Express server entry
```

## 🔥 Key Features

1. **Role-Based Access:** UI adjusts based on user type (donor/athlete/admin).
2. **Mock Backend:** Demonstrates frontend/backend flow without real database.
3. **Secure Routes:** Protected routes enforce JWT authentication.
4. **Responsive Design:** Tailwind CSS ensures usability on all devices.

## ⚙️ Installation & Setup

### Prerequisites

* Node.js v14+ and npm/yarn

### Clone & Setup

```bash
# Clone the repo
git clone https://github.com/Jazz7-Dev/fund2player.git
cd fund2player

# Setup backend
git checkout main
cd server
npm install
npm run start

# Setup frontend
cd ../client
npm install
npm run start
```

Open [http://localhost:3000](http://localhost:3000) for the frontend and [http://localhost:5000](http://localhost:5000) for the backend.

## 🎯 Usage

1. Choose a role and log in using test credentials.
2. As **donor**, view athlete listings and make a donation.
3. As **athlete**, view your received funds and donation history.
4. As **admin**, manage users and approve funding actions.

## 🤝 Contributing

1. Fork the repository.
2. Create a branch: `git checkout -b feature/YourFeature`.
3. Commit: `git commit -m 'feat: add YourFeature'`.
4. Push: `git push origin feature/YourFeature`.
5. Open a Pull Request.

## 📄 License

Distributed under the MIT License. See [LICENSE](LICENSE) for details.

---

*Built with ❤️ by Devansh (Jazz7-Dev)*
