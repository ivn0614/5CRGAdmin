import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../Firebase';

const Sidebar = () => {
    // Check localStorage for saved state, default to false if not found
    const savedCollapsedState = localStorage.getItem('sidebarCollapsed') === 'true';
    const [isCollapsed, setIsCollapsed] = useState(savedCollapsedState);
    const [userName, setUserName] = useState('Admin Panel');
    const navigate = useNavigate();

    // Update localStorage whenever the collapsed state changes
    useEffect(() => {
        localStorage.setItem('sidebarCollapsed', isCollapsed);
    }, [isCollapsed]);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(user => {
            if (user) {
                setUserName(user.displayName || user.email || 'Admin Panel');
            } else {
                setUserName('Admin Panel');
            }
        });
        return () => unsubscribe();
    }, []);

    const toggleSidebar = () => {
        setIsCollapsed(!isCollapsed);
    };

    // Custom navigation handler that preserves the sidebar state
    const handleNavigation = (path, event) => {
        event.preventDefault();
        navigate(path);
    };

    const icons = {
        menu: (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
        ),
        dashboard: (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="9"></rect>
                <rect x="14" y="3" width="7" height="5"></rect>
                <rect x="14" y="12" width="7" height="9"></rect>
                <rect x="3" y="16" width="7" height="5"></rect>
            </svg>
        ),
        news: (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"></path>
                <path d="M18 14h-8"></path>
                <path d="M15 18h-5"></path>
                <path d="M10 6h8v4h-8V6Z"></path>
            </svg>
        ),
        events: (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
        ),
        activities: (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
            </svg>
        ),
        educational: (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
            </svg>
        ),
        help: (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
        ),
        users: (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
        ),
        profile: (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
            </svg>
        ),
        ads: (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                <path d="M16 3v4"></path>
                <path d="M8 3v4"></path>
                <path d="M12 14l2 2 4-4"></path>
            </svg>
        )
    };

    const mainActions = [
        { name: 'Dashboard', path: '/dashboard', icon: icons.dashboard },
        { name: 'Activities', path: '/activities', icon: icons.activities },
        { name: 'Ads', path: '/ads', icon: icons.ads },
        { name: 'Educational', path: '/educational', icon: icons.educational },
        { name: 'Events', path: '/events', icon: icons.events },
        { name: 'Help Center', path: '/help', icon: icons.help },
        { name: 'News', path: '/news', icon: icons.news },
    ];

    const adminActions = [
        { name: 'User Management', path: '/users', icon: icons.users },
    ];

    // Custom NavItem component that uses onClick instead of NavLink's default behavior
    const NavItem = ({ item }) => {
        const isActive = window.location.pathname === item.path;
        
        return (
            <a
                href={item.path}
                onClick={(e) => handleNavigation(item.path, e)}
                className={`flex items-center ${isCollapsed ? 'justify-center' : ''} p-2 rounded-md transition-all duration-300 ${
                    isActive 
                      ? 'bg-indigo-600 text-white shadow-md' 
                      : 'hover:bg-indigo-500/80 hover:text-white hover:translate-x-1 hover:shadow-md'
                } text-sm relative overflow-hidden group`}
                title={isCollapsed ? item.name : ""}
            >
                <span className={`${isCollapsed ? '' : 'mr-3'} transition-transform duration-300 group-hover:scale-110`}>
                    {item.icon}
                </span>
                {!isCollapsed && (
                    <span className="transition-all duration-300 group-hover:font-medium">
                        {item.name}
                    </span>
                )}
            </a>
        );
    };

    return (
        <aside 
            className={`bg-navy-800 text-white min-h-screen fixed left-0 top-0 pt-16 transition-all duration-300 shadow-lg ${
                isCollapsed ? 'w-16' : 'w-64'
            } z-0`}
        >
            <div className="p-4 h-full overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                    {!isCollapsed && <h2 className="text-lg font-semibold truncate">{userName}</h2>}
                    <button 
                        onClick={toggleSidebar} 
                        className="p-2 rounded-md hover:bg-indigo-500 hover:text-white transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        aria-label="Toggle sidebar"
                    >
                        {icons.menu}
                    </button>
                </div>
                
                {/* Main Actions Section */}
                {!isCollapsed && <h3 className="text-sm font-semibold mb-4 text-indigo-300">Main Actions</h3>}
                <nav className={isCollapsed ? "flex flex-col items-center" : ""}>
                    <ul className="w-full">
                        {mainActions.map((item, index) => (
                            <li key={index} className="mb-3">
                                <NavItem item={item} />
                            </li>
                        ))}
                    </ul>
                </nav>

                {/* Administration Section */}
                {!isCollapsed && <h3 className="text-sm font-semibold mb-4 mt-6 text-indigo-300">Administration</h3>}
                {isCollapsed && <div className="border-t border-indigo-900/50 w-full my-4"></div>}
                <nav className={isCollapsed ? "flex flex-col items-center" : ""}>
                    <ul className="w-full">
                        {adminActions.map((item, index) => (
                            <li key={index} className="mb-3">
                                <NavItem item={item} />
                            </li>
                        ))}
                    </ul>
                </nav>
            </div>
        </aside>
    );
};

export default Sidebar;