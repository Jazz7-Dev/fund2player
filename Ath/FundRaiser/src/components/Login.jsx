import React, { useState } from 'react';

export default function Login({ onLogin = (user) => console.log('Login successful:', user) }) {
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
      // Validate inputs
      if (!email || !password) {
        throw new Error('Please fill in all fields');
      }

      // Email validation
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error('Please enter a valid email address');
      }

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock database - use exact values here
      const mockUsers = [
        { 
          email: 'admin@example.com',  // exact email
          password: 'admin123',        // exact password
          role: 'admin',               // exact role
          name: 'Admin User' 
        },
        { 
          email: 'athlete@example.com', 
          password: 'athlete123', 
          role: 'athlete', 
          name: 'Athlete User' 
        },
        { 
          email: 'donor@example.com', 
          password: 'donor123', 
          role: 'donor', 
          name: 'Donor User' 
        }
      ];

      // Find matching user (case sensitive for password, insensitive for email/role)
      const user = mockUsers.find(u => 
        u.email.toLowerCase() === email.toLowerCase() && 
        u.password === password &&  // password is case-sensitive
        u.role.toLowerCase() === role.toLowerCase()
      );

      if (!user) {
        console.log('Login failed - no matching user found for:', { email, role });
        throw new Error('Invalid email, password, or role combination');
      }

      // Successful login
      const mockResponse = {
        user: {
          email: user.email,
          role: user.role,
          name: user.name
        },
        token: `mock-token-${Math.random().toString(36).slice(2, 10)}`,
        expiresIn: 3600
      };

      console.log('Authentication successful:', mockResponse);
      onLogin(mockResponse);

    } catch (err) {
      console.error('Login error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

 
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-100 p-4">
   
      <form 
        onSubmit={handleSubmit}
        className="bg-white/30 backdrop-blur-lg border border-white/20 p-8 rounded-2xl shadow-xl w-full max-w-md transform transition-all duration-500 hover:shadow-2xl relative overflow-hidden"
      >
        {/* Animated background elements */}
        <div className="absolute -top-4 -left-4 w-8 h-8 bg-blue-300/30 rounded-full animate-bubble"></div>
        <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-indigo-300/30 rounded-full animate-bubble-delayed"></div>
        
        <h2 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Welcome Back
        </h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100/50 text-red-700 rounded-md animate-shake">
            {error}
          </div>
        )}

        <div className="mb-6 space-y-6">
          <div className="relative group">
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 pl-12 bg-white/50 backdrop-blur-sm border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-300 placeholder-gray-500/70 text-gray-800 hover:bg-white/70 focus:scale-[1.02]"
              placeholder="your@email.com"
              required
            />
            <svg 
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500/80 group-focus-within:text-blue-600 transition-colors"
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>

          <div className="relative group">
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 pl-12 bg-white/50 backdrop-blur-sm border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-300 placeholder-gray-500/70 text-gray-800 hover:bg-white/70 focus:scale-[1.02]"
              placeholder="••••••••"
              required
            />
            <svg 
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500/80 group-focus-within:text-blue-600 transition-colors"
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>

          <div className="relative group">
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-3 pr-12 bg-white/50 backdrop-blur-sm border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-300 appearance-none text-gray-800 hover:bg-white/70 focus:scale-[1.02]"
              required
            >
              <option value="donor">Donor</option>
              <option value="athlete">Athlete</option>
              <option value="admin">Admin</option>
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg 
                className="w-4 h-4 text-gray-500/80 group-focus-within:text-blue-600 transition-colors"
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-3 px-6 rounded-xl font-semibold transition-all duration-300 ${
            isLoading 
              ? 'bg-gradient-to-r from-blue-400 to-indigo-400 cursor-not-allowed' 
              : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:scale-[1.02] active:scale-95'
          } shadow-lg hover:shadow-xl`}
        >
          <span className="flex items-center justify-center space-x-2 text-white/90">
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <svg 
                  className="w-5 h-5 animate-pulse" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                <span>Continue</span>
              </>
            )}
          </span>
        </button>

        {/* <div className="mt-6 text-center text-sm text-gray-600/90">
          Don't have an account?{' '}
          <a 
            href="#" 
            className="text-blue-600/90 hover:text-blue-800/90 underline transition-colors"
            onClick={(e) => e.preventDefault()}
          >
            Get started
          </a>
        </div> */}
      </form>
      
      <style jsx global>{`
        @keyframes bubble {
          0% { transform: translateY(0) scale(1); opacity: 0.3; }
          50% { transform: translateY(-20px) scale(1.2); opacity: 0.5; }
          100% { transform: translateY(0) scale(1); opacity: 0.3; }
        }
        .animate-bubble {
          animation: bubble 6s ease-in-out infinite;
        }
        .animate-bubble-delayed {
          animation: bubble 6s ease-in-out infinite -3s;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          75% { transform: translateX(8px); }
        }
        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
      `}</style>
    </div>
  );
  
}