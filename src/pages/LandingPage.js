import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import crglogo from "../assets/crglogo.png";
import bgImage from "../assets/bg-landing.jpg";

const Landing = () => {
  const navigate = useNavigate();
  const handleGoToLogin = () => {
    navigate('/login');
  };

  useEffect(() => {
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.classList.add('opacity-100');
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 flex flex-col">
      <header className="bg-navy-900 py-4 px-6 border-b border-gray-700">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <img src={crglogo} alt="5th Civil Relations Group" className="h-8 hover:scale-105 transition-transform duration-300" />
          <div className='ml-4'>
            <h1 className="text-lg font-medium text-white">5th Civil Relations Group</h1>
            <p className="text-xs text-gray-300">Armed Forces of the Philippines</p>
          </div>
        </div>
      </div>
    </header>

      <main
        id="main-content"
        className="flex-1 flex items-center justify-center opacity-0 transition-opacity duration-1000 py-16 min-h-[calc(100vh-200px)]"
        style={{ backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        <div className="container mx-auto px-6 max-w-4xl text-center space-y-8">
          <div className="space-y-6">
            <h2 className="text-5xl md:text-7xl font-bold text-white tracking-tight">
              5th CRG - CRSAFP
            </h2>
            <p className="text-xl text-gray-200 max-w-2xl mx-auto leading-relaxed">
              Civil Relations Service AFP — Connecting military and civilian communities through strategic communication.
            </p>
          </div>

          <div className="space-y-6">
            <div className="w-16 h-px bg-gray-600 mx-auto"></div>
            
            <div className="space-y-3">
              <h3 className="text-lg font-medium text-white">Administrative Portal</h3>
              <p className="text-gray-200">
                Access the management system for news, events, and educational content.
              </p>
            </div>

            <button
              onClick={handleGoToLogin}
              className="bg-red-600 hover:bg-red-700 text-white py-3 px-8 rounded-full text-sm font-medium tracking-wide transition-all duration-300 ease-out"
            >
              LOGIN
            </button>
          </div>
        </div>
      </main>

      <footer className="border-t py-4 px-6">
        <div className="container mx-auto text-center">
          <p className="text-xs text-gray-400">© 2025 5th Civil Relations Group, CRSAFP. All Rights Reserved 2025</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;