import React, { useState } from 'react';

export default function Login({ onLogin = (user) => {
  console.log('Login successful:', user);
  // Default redirect if parent doesn't handle it
  window.location.href = '/dashboard';
}}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('donor');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      console.log('Login attempt started'); // Debug log

      // Basic validation
      if (!email || !password) {
        throw new Error('Please fill in all fields');
      }

      // Email format validation
      if (!/^\S+@\S+\.\S+$/.test(email)) {
        throw new Error('Please enter a valid email address');
      }

      // Mock API delay (1 second)
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock user database with names
      const mockUsers = [
        { email: 'admin@example.com', password: 'admin123', role: 'admin', name: 'Admin User' },
        { email: 'athlete@example.com', password: 'athlete123', role: 'athlete', name: 'Athlete User' },
        { email: 'donor@example.com', password: 'donor123', role: 'donor', name: 'Donor User' }
      ];

      // Find matching user (case insensitive)
      const user = mockUsers.find(u => 
        u.email.toLowerCase() === email.toLowerCase() && 
        u.password === password && 
        u.role.toLowerCase() === role.toLowerCase()
      );

      if (!user) {
        throw new Error('Invalid email, password, or role combination');
      }

      // Successful login response
      const mockResponse = {
        user: {
          email: user.email,
          role: user.role,
          name: user.name
        },
        token: `mock-token-${Math.random().toString(36).substr(2)}`,
        expiresIn: 3600
      };

      console.log("Login successful, calling onLogin with:", mockResponse);
      onLogin(mockResponse);

    } catch (err) {
      console.error('Login error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Add error boundary for the component
  try {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div style={{ border: '1px solid #ccc', borderRadius: '8px' }}> {/* Debug border */}
          <form 
            onSubmit={handleSubmit}
            className="bg-white p-8 rounded-lg shadow-md w-full max-w-md"
          >
            <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">Login</h2>
            
            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
                {error}
              </div>
            )}

            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="your@email.com"
                required
              />
            </div>

            <div className="mb-4">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
                required
              />
            </div>

            <div className="mb-6">
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="donor">Donor</option>
                <option value="athlete">Athlete</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-2 px-4 rounded-md text-white font-medium ${
                isLoading 
                  ? 'bg-blue-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'
              } transition-colors`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Logging in...
                </span>
              ) : 'Login'}
            </button>
          </form>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Component rendering error:', error);
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50 p-4">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p>Something went wrong with the login form.</p>
          <p className="mt-2 text-sm text-gray-600">{error.message}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }
}