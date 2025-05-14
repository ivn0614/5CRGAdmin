import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { firestore, storage } from '../Firebase'; // Updated to use firestore
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

const EventsPage = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    eventName: '',
    eventTheme: '',
    startDate: '',
    endDate: '',
    description: '',
    logo: null
  });
  const [logoPreview, setLogoPreview] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [currentEventId, setCurrentEventId] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    // Fetch events from Firestore
    const fetchEvents = async () => {
      try {
        const eventsCollection = collection(firestore, 'events');
        const eventsQuery = query(eventsCollection, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(eventsQuery);
        
        const eventsArray = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setEvents(eventsArray);
      } catch (error) {
        console.error("Error fetching events:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchEvents();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({
        ...formData,
        logo: file
      });

      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadLogo = async (file, eventId) => {
    if (!file) return null;
    
    try {
      // Create a unique filename with timestamp to avoid collisions
      const timestamp = new Date().getTime();
      const fileName = `${timestamp}_${file.name}`;
      const fileRef = storageRef(storage, `event-logos/${eventId}/${fileName}`);
      
      // Upload the file
      await uploadBytes(fileRef, file);
      
      // Get the download URL
      const downloadURL = await getDownloadURL(fileRef);
      
      // Update progress
      setUploadProgress(100);
      
      return downloadURL;
    } catch (error) {
      console.error("Error uploading logo:", error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setUploadProgress(0);

    try {
      let eventId = currentEventId;
      let logoURL = null;
      
      const status = new Date(formData.endDate) < new Date() ? 'Completed' : 'Upcoming';
      
      const eventData = {
        name: formData.eventName,
        theme: formData.eventTheme,
        startDate: formData.startDate,
        endDate: formData.endDate,
        description: formData.description,
        status: status,
        updatedAt: new Date().toISOString()
      };
      
      // If creating new event
      if (!isEditing) {
        eventData.createdAt = new Date().toISOString();
        
        // First create the document to get an ID
        const docRef = await addDoc(collection(firestore, 'events'), eventData);
        eventId = docRef.id;
        
        // Upload logo if there's a file
        if (formData.logo && formData.logo instanceof File) {
          logoURL = await uploadLogo(formData.logo, eventId);
          
          // Update the document with the logo URL
          if (logoURL) {
            await updateDoc(doc(firestore, 'events', eventId), {
              logoURL: logoURL
            });
          }
        }
        
        // Refresh the events list
        const updatedEvent = {
          id: eventId,
          ...eventData,
          logoURL: logoURL
        };
        
        setEvents([updatedEvent, ...events]);
      } 
      // If editing existing event
      else {
        // Upload new logo if there's a file
        if (formData.logo && formData.logo instanceof File) {
          logoURL = await uploadLogo(formData.logo, eventId);
          eventData.logoURL = logoURL;
        } else if (logoPreview && typeof logoPreview === 'string' && logoPreview.startsWith('http')) {
          // Keep existing logo URL
          eventData.logoURL = logoPreview;
        }
        
        // Update the document
        await updateDoc(doc(firestore, 'events', eventId), eventData);
        
        // Update local state
        setEvents(events.map(event => 
          event.id === eventId ? { ...event, ...eventData } : event
        ));
      }

      // Reset form and state
      resetForm();
      
      // Optionally show success message
      alert("Event saved successfully!");
    } catch (error) {
      console.error("Error saving event:", error);
      alert("Failed to save event. Please try again.");
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const resetForm = () => {
    setFormData({
      eventName: '',
      eventTheme: '',
      startDate: '',
      endDate: '',
      description: '',
      logo: null
    });
    setLogoPreview(null);
    setShowForm(false);
    setIsEditing(false);
    setCurrentEventId(null);
    setUploadProgress(0);
  };

  const handleViewActivities = (eventId) => {
    navigate(`/activities?eventId=${eventId}`);
  };

  const handleEditEvent = (event) => {
    setCurrentEventId(event.id);
    setFormData({
      eventName: event.name,
      eventTheme: event.theme,
      startDate: event.startDate,
      endDate: event.endDate,
      description: event.description,
      logo: null // We don't set the file object when editing
    });
    
    if (event.logoURL) {
      setLogoPreview(event.logoURL);
    }
    
    setIsEditing(true);
    setShowForm(true);
  };

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
      setEvents(events.filter(event => event.id !== eventId));
      
      // Show success message
      alert("Event deleted successfully!");
    } catch (error) {
      console.error("Error deleting event:", error);
      alert("Failed to delete event. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Events Management</h1>
          <p className="text-gray-600">Create and manage your events</p>
        </div>
        <button 
          onClick={() => {
            if (showForm) {
              resetForm();
            } else {
              setShowForm(true);
            }
          }} 
          className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded flex items-center"
          disabled={loading}
        >
          <span className="mr-2">{showForm ? '✕' : '+'}</span>
          {showForm ? 'Cancel' : 'Add New Event'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-navy-900 mb-4">
            {isEditing ? 'Edit Event' : 'Create New Event'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-700 mb-2">Event Name *</label>
                <input
                  type="text"
                  name="eventName"
                  value={formData.eventName}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Event Theme *</label>
                <input
                  type="text"
                  name="eventTheme"
                  value={formData.eventTheme}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Start Date *</label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2">End Date *</label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={loading}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-gray-700 mb-2">Description *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 h-32"
                  required
                  disabled={loading}
                ></textarea>
              </div>
              <div className="md:col-span-2">
                <label className="block text-gray-700 mb-2">Event Logo</label>
                <div className="flex items-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={loading}
                  />
                  {logoPreview && (
                    <div className="ml-4">
                      <img src={logoPreview} alt="Logo preview" className="h-16 w-16 object-contain" />
                    </div>
                  )}
                </div>
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="mt-2">
                    <div className="bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full" 
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Uploading: {Math.round(uploadProgress)}%</p>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={resetForm}
                className="mr-2 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
                disabled={loading}
              >
                {loading ? 'Saving...' : isEditing ? 'Update Event' : 'Save Event'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-navy-900 mb-4">Events List</h2>
        {loading && !showForm ? (
          <div className="text-center py-4">
            <p>Loading events...</p>
          </div>
        ) : events.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No events found. Create your first event!</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr className="bg-gray-100 text-gray-600 text-left">
                  <th className="py-3 px-4 font-semibold">Event Name</th>
                  <th className="py-3 px-4 font-semibold">Theme</th>
                  <th className="py-3 px-4 font-semibold">Start Date</th>
                  <th className="py-3 px-4 font-semibold">End Date</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="text-gray-600">
                {events.map((event) => (
                  <tr key={event.id} className="border-b border-gray-200">
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        {event.logoURL ? (
                          <img src={event.logoURL} alt={event.name} className="w-8 h-8 mr-2 object-contain" />
                        ) : (
                          <div className="w-8 h-8 mr-2 bg-gray-200 rounded-full flex items-center justify-center">
                            <span>📅</span>
                          </div>
                        )}
                        {event.name}
                      </div>
                    </td>
                    <td className="py-3 px-4">{event.theme}</td>
                    <td className="py-3 px-4">{formatDate(event.startDate)}</td>
                    <td className="py-3 px-4">{formatDate(event.endDate)}</td>
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
                        className="text-red-500 hover:text-blue-700 hover:scale-110 mr-2 rounded-full p-1 hover:bg-blue-200"
                        onClick={() => handleViewActivities(event.id)}
                        disabled={loading}
                      >
                        👁️
                      </button>
                      <button 
                        className="text-red-500 hover:text-blue-700 hover:scale-110 mr-2 rounded-full p-1 hover:bg-yellow-200"
                        onClick={() => handleEditEvent(event)}
                        disabled={loading}
                      >
                        📝
                      </button>
                      <button 
                        className="text-red-500 hover:text-blue-700 hover:scale-110 mr-2 rounded-full p-1 hover:bg-red-200"
                        onClick={() => handleDeleteEvent(event.id, event.logoURL)}
                        disabled={loading}
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default EventsPage;