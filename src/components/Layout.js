import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <Sidebar />
      <main className="ml-64 pt-20 pb-16 min-h-screen">
        <div className="p-6">
          {children}
        </div>
      </main>
      <div className="ml-64">
        <Footer />
      </div>
    </div>
  );
};

export default Layout;