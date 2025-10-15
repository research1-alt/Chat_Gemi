import React, { useState } from 'react';

type User = {
  name: string;
  email: string;
};

interface AuthPageProps {
  onAuthSuccess: (user: User) => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onAuthSuccess }) => {
  const [viewMode, setViewMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [retrievedPassword, setRetrievedPassword] = useState<string | null>(null);

  const clearForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setError('');
    setRetrievedPassword(null);
  };

  const toggleView = () => {
    setViewMode(viewMode === 'login' ? 'signup' : 'login');
    clearForm();
  };
  
  const validateAuthForm = () => {
      if (viewMode === 'signup' && !name.trim()) {
          setError('Name is required.');
          return false;
      }
      if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
          setError('Please enter a valid email address.');
          return false;
      }
      if (password.length < 6) {
          setError('Password must be at least 6 characters long.');
          return false;
      }
      setError('');
      return true;
  }

  const handleAuthSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateAuthForm()) return;

    setIsLoading(true);
    
    setTimeout(() => {
        try {
            if (viewMode === 'login') {
                const users = JSON.parse(localStorage.getItem('users') || '[]');
                const foundUser = users.find(
                    (user: any) => user.email === email && user.password === password
                );
                if (foundUser) {
                    onAuthSuccess({ name: foundUser.name, email: foundUser.email });
                } else {
                    setError('Invalid email or password.');
                }
            } else { // signup
                const users = JSON.parse(localStorage.getItem('users') || '[]');
                const existingUser = users.find((user: any) => user.email === email);
                if (existingUser) {
                    setError('An account with this email already exists.');
                } else {
                    const newUser = { name, email, password };
                    users.push(newUser);
                    localStorage.setItem('users', JSON.stringify(users));
                    onAuthSuccess({ name, email });
                }
            }
        } catch (e) {
            setError("An unexpected error occurred. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }, 500);
  };
  
  const handleForgotSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
        setError('Please enter a valid email address.');
        return;
    }
    setError('');
    setIsLoading(true);
    setRetrievedPassword(null);

    setTimeout(() => {
        try {
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            const foundUser = users.find((user: any) => user.email === email);
            if (foundUser) {
                setRetrievedPassword(foundUser.password);
            } else {
                setError('No account found with this email address.');
            }
        } catch (e) {
            setError("An unexpected error occurred. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }, 500);
  };

  const renderForgotView = () => (
    <div className="max-w-md w-full bg-gray-50 border border-gray-200 rounded-lg p-8 shadow-2xl">
        <h1 className="text-3xl font-bold text-gray-800 mb-4 text-center">
          Retrieve Password
        </h1>
        <p className="text-gray-600 mb-8 text-center">
            Enter your email to find your password.
        </p>
        <form onSubmit={handleForgotSubmit} className="space-y-6">
            <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                />
            </div>
            
            {error && <p className="text-sm text-red-600 text-center">{error}</p>}

            {retrievedPassword && (
              <div className="p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700">
                  <p className="font-bold">Password Found</p>
                  <p>Your password is: <strong>{retrievedPassword}</strong></p>
                  <p className="text-xs mt-2"><strong>Note:</strong> This is for demonstration only. In a real application, passwords would be securely reset, not displayed.</p>
              </div>
            )}

            <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-wait"
                >
                  {isLoading ? 'Searching...' : 'Retrieve Password'}
                </button>
            </div>
        </form>
        <p className="mt-6 text-center text-sm text-gray-600">
            Remembered your password?
            <button onClick={() => { setViewMode('login'); clearForm(); }} className="ml-1 font-medium text-green-600 hover:text-green-500">
                Back to Login
            </button>
        </p>
    </div>
  );

  const renderAuthView = () => (
      <div className="max-w-md w-full bg-gray-50 border border-gray-200 rounded-lg p-8 shadow-2xl">
        <h1 className="text-3xl font-bold text-gray-800 mb-4 text-center">
          {viewMode === 'login' ? 'Welcome Back!' : 'Create Account'}
        </h1>
        <p className="text-gray-600 mb-8 text-center">
            {viewMode === 'login' ? 'Log in to access your assistant.' : 'Sign up to get started.'}
        </p>
        
        <form onSubmit={handleAuthSubmit} className="space-y-6">
          {viewMode === 'signup' && (
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
              />
            </div>
          )}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
            />
          </div>
          <div>
            <div className="flex justify-between items-center">
                <label htmlFor="password"className="block text-sm font-medium text-gray-700">Password</label>
                {viewMode === 'login' && (
                    <div className="text-sm">
                        <button 
                            type="button" 
                            onClick={() => { setViewMode('forgot'); clearForm(); }} 
                            className="font-medium text-green-600 hover:text-green-500"
                        >
                            Forgot password?
                        </button>
                    </div>
                )}
            </div>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete={viewMode === 'login' ? 'current-password' : 'new-password'}
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
            />
          </div>
          
          {error && <p className="text-sm text-red-600 text-center">{error}</p>}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-wait"
            >
              {isLoading ? 'Processing...' : (viewMode === 'login' ? 'Login' : 'Sign Up')}
            </button>
          </div>
        </form>
        
        <p className="mt-6 text-center text-sm text-gray-600">
          {viewMode === 'login' ? "Don't have an account?" : 'Already have an account?'}
          <button onClick={toggleView} className="ml-1 font-medium text-green-600 hover:text-green-500">
            {viewMode === 'login' ? 'Sign Up' : 'Login'}
          </button>
        </p>
      </div>
  );

  return (
    <div className="h-screen w-screen bg-white flex items-center justify-center font-sans text-gray-900 p-4">
      {viewMode === 'forgot' ? renderForgotView() : renderAuthView()}
    </div>
  );
};

export default AuthPage;