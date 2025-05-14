import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { firestore, storage } from '../Firebase';
import { collection, getDocs, query, orderBy, where, doc, deleteDoc } from 'firebase/firestore';
import { ref as storageRef, deleteObject } from 'firebase/storage';

const Dashboard = () => {
  const navigate = useNavigate();
  const [eventsCount, setEventsCount] = useState(0);
  const [activitiesCount, setActivitiesCount] = useState(0);
  const [upcomingActivitiesCount, setUpcomingActivitiesCount] = useState(0);
  const [recentEvents, setRecentEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const eventsCollection = collection(firestore, 'events');
      const eventsSnapshot = await getDocs(eventsCollection);
      const eventsCount = eventsSnapshot.size;
      setEventsCount(eventsCount);

      const recentEventsQuery = query(
        eventsCollection,
        orderBy('createdAt', 'desc') 
      );
      const recentEventsSnapshot = await getDocs(recentEventsQuery);
      
      const recentEventsData = recentEventsSnapshot.docs
        .slice(0, 5)
        .map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.name,
            date: formatDateRange(data.startDate, data.endDate),
            status: data.status || 'Upcoming',
            logoURL: data.logoURL || null
          };
        });
      
      setRecentEvents(recentEventsData);
      
      // Fetch activities data
      const activitiesCollection = collection(firestore, 'activities');
      const activitiesSnapshot = await getDocs(activitiesCollection);
      setActivitiesCount(activitiesSnapshot.size);
      
      // Fetch upcoming activities (activities with endDate >= today)
      const upcomingActivitiesQuery = query(
        activitiesCollection,
        where('endDate', '>=', today)
      );
      
      const upcomingActivitiesSnapshot = await getDocs(upcomingActivitiesQuery);
      setUpcomingActivitiesCount(upcomingActivitiesSnapshot.size);
      
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Helper function to format date range
  const formatDateRange = (startDate, endDate) => {
    const formatDate = (dateString) => {
      const options = { year: 'numeric', month: 'short', day: 'numeric' };
      return new Date(dateString).toLocaleDateString(undefined, options);
    };
    
    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  };

  // Function to handle event deletion
  const handleDeleteEvent = async (eventId, logoURL) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    
    setLoading(true);
    
    try {
      // Delete the event from Firestore
      await deleteDoc(doc(firestore, 'events', eventId));
      
      // Delete the logo from storage if it exists
      if (logoURL) {
        try {
          // Extract the path from the URL
          const logoPath = decodeURIComponent(logoURL.split('/o/')[1].split('?')[0]);
          const fileRef = storageRef(storage, logoPath);
          await deleteObject(fileRef);
        } catch (error) {
          console.error("Error deleting logo:", error);
          // Continue even if logo deletion fails
        }
      }
      
      // Update local state
      setRecentEvents(recentEvents.filter(event => event.id !== eventId));
      
      // Refetch dashboard data to update counts
      fetchDashboardData();
      
      // Show success message
      alert("Event deleted successfully!");
    } catch (error) {
      console.error("Error deleting event:", error);
      alert("Failed to delete event. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    { title: 'Total Events', value: eventsCount.toString(), icon: '📅', color: 'bg-blue-500' },
    { title: 'Upcoming Activities', value: upcomingActivitiesCount.toString(), icon: '🏆', color: 'bg-green-500' },
    { title: 'Total Activities', value: activitiesCount.toString(), icon: '📋', color: 'bg-yellow-500' },
    { title: 'Site Visits', value: '0', icon: '📍', color: 'bg-purple-500' },
  ];

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy-900">Dashboard</h1>
        <p className="text-gray-600">Welcome to the 5th CRG Admin Dashboard</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md p-6 flex items-center">
            <div className={`${stat.color} text-white p-4 rounded-full mr-4`}>
              <span className="text-2xl">{stat.icon}</span>
            </div>
            <div>
              <h3 className="text-gray-500 text-sm">{stat.title}</h3>
              <p className="text-2xl font-bold text-navy-900">
                {loading ? '...' : stat.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-bold text-navy-900 mb-4">Recent Events</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr className="bg-gray-100 text-gray-600 text-left">
                <th className="py-3 px-4 font-semibold">Event Title</th>
                <th className="py-3 px-4 font-semibold">Date</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="text-gray-600">
              {loading ? (
                <tr>
                  <td colSpan="4" className="py-3 px-4 text-center">Loading events...</td>
                </tr>
              ) : recentEvents.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-3 px-4 text-center">No recent events</td>
                </tr>
              ) : (
                recentEvents.map((event) => (
                  <tr key={event.id} className="border-b border-gray-200">
                    <td className="py-3 px-4">{event.title}</td>
                    <td className="py-3 px-4">{event.date}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        event.status === 'Completed' ? 'bg-green-100 text-green-800' : 
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {event.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                    <button 
                        className="text-blue-500 transition-all duration-300 transform hover:text-blue-700 hover:scale-110 mr-2 rounded-full p-1 hover:bg-blue-200"
                        onClick={() => navigate(`/activities?eventId=${event.id}`)}
                      >
                        👁️
                      </button>
                      <button 
                        className="text-yellow-500 hover:text-blue-700 hover:scale-110 mr-2 rounded-full p-1 hover:bg-yellow-200"
                        onClick={() => navigate(`/events?edit=${event.id}`)}
                      >
                        📝
                      </button>
                      <button 
                        className="text-red-500 hover:text-blue-700 hover:scale-110 mr-2 rounded-full p-1 hover:bg-red-200"
                        onClick={() => handleDeleteEvent(event.id, event.logoURL)}
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-navy-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button onClick={() => navigate('/events')} className="bg-blue-500 text-white py-3 px-4 rounded-md hover:bg-blue-600 transition duration-300 flex items-center justify-center">
            <span className="mr-2">📅</span> Create New Event
          </button>
          <button onClick={() => navigate('/activities')} className="bg-green-500 text-white py-3 px-4 rounded-md hover:bg-green-600 transition duration-300 flex items-center justify-center">
            <span className="mr-2">🏆</span> Add New Activity
          </button>
          <button onClick={() => navigate('/users')} className="bg-purple-500 text-white py-3 px-4 rounded-md hover:bg-purple-600 transition duration-300 flex items-center justify-center">
            <span className="mr-2">👥</span> Manage Users
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;