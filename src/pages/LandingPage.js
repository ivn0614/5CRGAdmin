import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import crglogo from "../assets/crglogo.png";
import crslogo from "../assets/crslogo.png";

const Landing = () => {
  const navigate = useNavigate();

  const handleGoToLogin = () => {
    navigate('/login');
  };

  // Subtle fade-in effect when the page loads
  useEffect(() => {
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.classList.add('opacity-100');
    }
  }, []);

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
              onClick={handleGoToLogin}
              className="bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded-lg transition duration-300 text-sm font-semibold"
            >
              Admin Login
            </button>
          </div>
        </div>
      </header>

      {/* Main Content - Optimized spacing */}
      <main
        id="main-content"
        className="flex-grow flex flex-col items-center justify-center bg-cover bg-center opacity-0 transition-opacity duration-1000 py-4"
        style={{ 
          backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.8)), url("/background.jpg")',
          backgroundAttachment: 'fixed'
        }}
      >
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Left Side Content - More compact */}
          <div className="text-center md:text-left md:w-1/2 mb-4 md:mb-0">
            <h2 className="text-3xl md:text-4xl font-bold mb-2">Civil Relations Service AFP</h2>
            <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-teal-300 mb-3">CRSAFP</h1>
            <p className="text-gray-300 text-base max-w-lg mb-4">
              Connecting the military and civilian communities through innovative engagement and strategic communication.
            </p>
            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
              <button
                onClick={handleGoToLogin}
                className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-6 rounded-lg transition duration-300 font-bold text-base shadow-lg hover:shadow-blue-500/40 transform hover:translate-y-1 hover:scale-105"
              >
                LOGIN NOW
              </button>
              <button className="bg-transparent border-2 border-white text-white py-2 px-6 rounded-lg transition duration-300 font-bold text-base hover:bg-white hover:text-navy-900">
                LEARN MORE
              </button>
            </div>
          </div>

          {/* Right Side Card - More compact */}
          <div className="w-full md:w-1/2 max-w-md">
            <div className="bg-white/10 backdrop-blur-md rounded-xl shadow-2xl p-6 border border-white/20 transform transition duration-500 hover:scale-105">
              <div className="flex justify-center mb-3">
                <img src={crslogo} alt="Logo" className="h-16 drop-shadow-lg" />
              </div>
              <h2 className="text-white font-bold mb-1 text-lg">5th Civil Relations Group</h2>
              <div className="h-1 w-20 bg-gradient-to-r from-blue-500 to-teal-400 mx-auto mb-3 rounded-full"></div>
              <h3 className="font-bold text-2xl mb-3 text-transparent bg-clip-text bg-gradient-to-r from-white to-blue-300">Welcome</h3>
              
              <p className="text-gray-200 mb-4 text-sm">
                Administrative Portal for the 5th Civil Relations Group.
                Manage news, events, activities and educational contents.
              </p>
              
              <button
                onClick={handleGoToLogin}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white py-2 px-6 rounded-lg transition duration-300 font-bold text-base shadow-lg"
              >
                ACCESS PORTAL
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer - Simplified */}
      <footer className="bg-navy-800 py-3 px-4">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center mb-2">
            <div className="flex items-center mb-2 md:mb-0">
              <img src={crglogo} alt="5th Civil Relations Group" className="h-8 mr-2" />
              <h3 className="text-base font-bold">5th Civil Relations Group</h3>
            </div>
            <div className="flex space-x-3">
            <a href="https://www.facebook.com/5thcrg" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition">
              <span className="sr-only">Facebook</span>
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
              </svg>
            </a>
            </div>
          </div>
          <div className="border-t border-gray-700 pt-2 flex flex-col md:flex-row justify-between items-center">
            <p className="text-xs text-gray-400 mb-1 md:mb-0">© 2025 5th Civil Relations Group, CRSAFP. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;