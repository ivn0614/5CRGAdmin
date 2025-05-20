import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { ref, get } from 'firebase/database';
import { auth, db } from '../Firebase';
import crglogo from "../assets/crglogo.png";
import crslogo from "../assets/crslogo.png";

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.classList.add('opacity-100');
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };


const handleSubmit = async (e) => {
  e.preventDefault();
  if (!formData.email || !formData.password) {
    setErrorMessage('Email and password are required');
    return;
  }

  setIsLoading(true);
  setErrorMessage('');
  
  try {
    // First attempt to authenticate with Firebase Auth
    const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
    const uid = userCredential.user.uid;
    
    // After authentication succeeds, check if user exists in the database
    const userRef = ref(db, 'users/' + uid);
    const userSnapshot = await get(userRef);
    
    if (userSnapshot.exists()) {
      // User exists in database, proceed with login
      console.log("Login successful for user:", uid);
      
      // Redirect to the intended page or dashboard
      const from = location.state?.from || '/dashboard';
      navigate(from);
    } else {
      // User authenticated but not in database, sign out
      await auth.signOut();
      setErrorMessage('User not registered in the system. Please contact an administrator.');
    }
  } catch (error) {
    console.error("Login error:", error);
    
    // Handle specific error cases
    switch (error.code) {
      case 'auth/user-not-found':
        setErrorMessage('No account found with this email address');
        break;
      case 'auth/wrong-password':
        setErrorMessage('Incorrect password');
        break;
      case 'auth/invalid-email':
        setErrorMessage('Invalid email format');
        break;
      case 'auth/too-many-requests':
        setErrorMessage('Too many failed login attempts. Please try again later');
        break;
      case 'auth/invalid-credential':
        setErrorMessage('Invalid credentials. Please check your email and password.');
        break;
      default:
        setErrorMessage('Failed to log in: ' + error.message);
    }
  } finally {
    setIsLoading(false);
  }
};

  return (
    <div className="min-h-screen flex flex-col bg-navy-900 text-white">
      {/* Header - Made more compact */}
      <header className="bg-navy-900 py-2 px-6 shadow-md">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <img src={crglogo} alt="5th Civil Relations Group" className="h-12 hover:scale-105 transition-transform duration-300" />
            <div className="ml-4">
              <h1 className="text-xl font-bold">5th Civil Relations Group</h1>
              <p className="text-xs text-gray-300">Armed Forces of the Philippines</p>
            </div>
          </div>
          <div className="hidden md:block">
            <button
              onClick={() => navigate('/')}
              className="bg-transparent border border-gray-300 hover:border-white text-white py-1 px-3 rounded-lg transition duration-300 text-sm font-semibold"
            >
              Back to Home
            </button>
          </div>
        </div>
      </header>

      {/* Main Content - Optimized spacing */}
      <main 
        className="flex-grow flex flex-col items-center justify-center bg-cover bg-center py-4"
        style={{ 
          backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.8)), url("/background.jpg")',
          backgroundAttachment: 'fixed'
        }}
      >
        <div className="text-center mb-2">
          <h2 className="text-2xl font-bold">Civil Relations Service AFP</h2>
          <h1 className="text-4xl font-bold mt-1 text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-teal-300">CRSAFP</h1>
        </div>

        <div 
          id="login-form"
          className="bg-white/10 backdrop-blur-md rounded-xl shadow-2xl p-6 w-full max-w-md border border-white/20 opacity-0 transition-opacity duration-1000 transform hover:scale-100"
        >
          <div className="flex justify-center mb-2">
            <img src={crslogo} alt="Logo" className="h-16 drop-shadow-lg" />
          </div>
          
          <div className="text-center mb-3">
            <h2 className="text-white font-bold text-lg">5th Civil Relations Group</h2>
            <div className="h-1 w-20 bg-gradient-to-r from-blue-500 to-teal-400 mx-auto mt-1 mb-2 rounded-full"></div>
            <h3 className="font-bold text-2xl text-transparent bg-clip-text bg-gradient-to-r from-white to-blue-300">ADMIN LOGIN</h3>
          </div>

          {errorMessage && (
            <div className="mb-4 p-2 rounded-lg bg-red-500/20 border-red-500/30 text-red-100 border text-sm backdrop-blur-sm animate-pulse">
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errorMessage}
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-gray-200 text-xs font-medium mb-1">Email</label>
              <div className="flex items-center bg-white/5 border border-white/10 hover:border-blue-400/50 focus-within:border-blue-400 rounded-lg px-3 py-2 transition-all duration-300">
                <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"></path>
                </svg>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="flex-grow bg-transparent outline-none text-white placeholder-gray-400 text-sm"
                  placeholder="Enter your email"
                  required
                  autoComplete="email"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-gray-200 text-xs font-medium mb-1">Password</label>
              <div className="flex items-center bg-white/5 border border-white/10 hover:border-blue-400/50 focus-within:border-blue-400 rounded-lg px-3 py-2 transition-all duration-300">
                <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                </svg>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="flex-grow bg-transparent outline-none text-white placeholder-gray-400 text-sm"
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="text-gray-400 hover:text-white transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full ${
                isLoading 
                ? 'bg-blue-700/50 cursor-not-allowed' 
                : 'bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900'
              } text-white py-2 px-4 rounded-lg transition duration-300 font-bold text-base shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>
        </div>
      </main>

      {/* Footer - Simplified */}
      <footer className="bg-navy-800 py-3 px-4">
        <div className="container mx-auto">
          <div className="border-t border-gray-700 pt-2 flex flex-col md:flex-row justify-between items-center">
            <p className="text-xs text-gray-400 mb-1 md:mb-0">© 2025 5th Civil Relations Group, CRSAFP. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Login;