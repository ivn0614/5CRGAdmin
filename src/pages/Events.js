import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { firestore, storage } from '../Firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const getToastStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-500 border-green-600 text-white';
      case 'error':
        return 'bg-red-500 border-red-600 text-white';
      case 'warning':
        return 'bg-yellow-500 border-yellow-600 text-white';
      case 'info':
        return 'bg-blue-500 border-blue-600 text-white';
      default:
        return 'bg-gray-500 border-gray-600 text-white';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '📢';
    }
  };

  return (
    <div className={`fixed top-4 right-4 z-50 border-l-4 p-4 rounded-lg shadow-lg transform transition-all duration-300 ease-in-out ${getToastStyles()} max-w-md`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <span className="text-xl mr-3">{getIcon()}</span>
          <span className="font-medium">{message}</span>
        </div>
        <button
          onClick={onClose}
          className="ml-4 text-white hover:text-gray-200 font-bold text-lg"
        >
          ×
        </button>
      </div>
    </div>
  );
};

// Confirmation Modal Component
const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = "Delete", cancelText = "Cancel", type = "danger" }) => {
  if (!isOpen) return null;

  const getConfirmButtonStyles = () => {
    switch (type) {
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 text-white';
      case 'warning':
        return 'bg-yellow-600 hover:bg-yellow-700 text-white';
      case 'info':
        return 'bg-blue-600 hover:bg-blue-700 text-white';
      default:
        return 'bg-gray-600 hover:bg-gray-700 text-white';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return '🗑️';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '❓';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 transform transition-all duration-300 scale-100">
        <div className="p-6">
          <div className="flex items-center mb-4">
            <div className="flex-shrink-0">
              <span className="text-3xl">{getIcon()}</span>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {title}
              </h3>
            </div>
          </div>
          <div className="mb-6">
            <p className="text-gray-600">
              {message}
            </p>
          </div>
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`px-4 py-2 rounded-lg transition-colors font-medium ${getConfirmButtonStyles()}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

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
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    type: 'danger'
  });

  // Toast helper functions
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const closeToast = () => {
    setToast(null);
  };

  // Confirmation modal helper functions
  const showConfirmModal = (title, message, onConfirm, type = 'danger') => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm,
      type
    });
  };

  const closeConfirmModal = () => {
    setConfirmModal({
      isOpen: false,
      title: '',
      message: '',
      onConfirm: null,
      type: 'danger'
    });
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setError(null);
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
      setError("Failed to load events. Please check your Firebase configuration.");
      showToast("Failed to load events. Please check your Firebase configuration.", "error");
    } finally {
      setLoading(false);
    }
  };

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
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        showToast("File size must be less than 5MB", "warning");
        return;
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        showToast("Please select an image file", "warning");
        return;
      }

      setFormData({
        ...formData,
        logo: file
      });
      
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
      setUploadProgress(10);
      const timestamp = new Date().getTime();
      const fileName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      const fileRef = storageRef(storage, `event-logos/${eventId}/${fileName}`);
      
      setUploadProgress(50);
      await uploadBytes(fileRef, file);
      
      setUploadProgress(80);
      const downloadURL = await getDownloadURL(fileRef);
      setUploadProgress(100);
      
      return downloadURL;
    } catch (error) {
      console.error("Error uploading logo:", error);
      setUploadProgress(0);
      throw new Error("Failed to upload logo: " + error.message);
    }
  };

  const deletePreviousLogo = async (logoURL) => {
    if (!logoURL) return;
    
    try {
      // Extract the file path from the download URL
      const url = new URL(logoURL);
      const fullPath = decodeURIComponent(url.pathname.split('/o/')[1]);
      const fileRef = storageRef(storage, fullPath);
      await deleteObject(fileRef);
    } catch (error) {
      console.error("Error deleting previous logo:", error);
      // Don't throw error as this is not critical
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setUploadProgress(0);
    setError(null);

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
        updatedAt: serverTimestamp()
      };

      if (!isEditing) {
        // Creating new event
        eventData.createdAt = serverTimestamp();
        
        // First create the document to get the ID
        const docRef = await addDoc(collection(firestore, 'events'), eventData);
        eventId = docRef.id;
        
        // Upload logo if provided
        if (formData.logo && formData.logo instanceof File) {
          logoURL = await uploadLogo(formData.logo, eventId);
          
          // Update document with logo URL
          await updateDoc(doc(firestore, 'events', eventId), {
            logoURL: logoURL
          });
        }
        
        // Add to local state
        const newEvent = {
          id: eventId,
          ...eventData,
          logoURL: logoURL,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        setEvents([newEvent, ...events]);
        showToast("Event created successfully!", "success");
        
      } else {
        // Updating existing event
        const existingEvent = events.find(e => e.id === eventId);
        
        // Handle logo upload/update
        if (formData.logo && formData.logo instanceof File) {
          // Delete previous logo if exists
          if (existingEvent?.logoURL) {
            await deletePreviousLogo(existingEvent.logoURL);
          }
          
          // Upload new logo
          logoURL = await uploadLogo(formData.logo, eventId);
          eventData.logoURL = logoURL;
        } else if (logoPreview && typeof logoPreview === 'string' && logoPreview.startsWith('http')) {
          // Keep existing logo
          eventData.logoURL = logoPreview;
        }
        
        // Update the document
        await updateDoc(doc(firestore, 'events', eventId), eventData);
        
        // Update local state
        setEvents(events.map(event => 
          event.id === eventId ? { 
            ...event, 
            ...eventData, 
            updatedAt: new Date().toISOString() 
          } : event
        ));
        
        showToast("Event updated successfully!", "success");
      }
      
      resetForm();
      
    } catch (error) {
      console.error("Error saving event:", error);
      const errorMessage = error.message || "Failed to save event. Please try again.";
      setError(errorMessage);
      showToast(errorMessage, "error");
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
    setError(null);
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
      logo: null
    });
    
    if (event.logoURL) {
      setLogoPreview(event.logoURL);
    }
    
    setIsEditing(true);
    setShowForm(true);
  };

  const handleDeleteEvent = async (eventId, logoURL) => {
    showConfirmModal(
      "Delete Event",
      "Are you sure you want to delete this event?",
      async () => {
        closeConfirmModal();
        setLoading(true);
        setError(null);
        
        try {
          // Delete the document from Firestore
          await deleteDoc(doc(firestore, 'events', eventId));
          
          // Delete the logo from Storage if it exists
          if (logoURL) {
            await deletePreviousLogo(logoURL);
          }
          
          // Update local state
          setEvents(events.filter(event => event.id !== eventId));
          
          showToast("Event deleted successfully!", "success");
        } catch (error) {
          console.error("Error deleting event:", error);
          const errorMessage = "Failed to delete event. Please try again.";
          setError(errorMessage);
          showToast(errorMessage, "error");
        } finally {
          setLoading(false);
        }
      },
      "danger"
    );
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <Layout>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={closeToast}
        />
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={closeConfirmModal}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
      />

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
          className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded flex items-center transition-colors"
          disabled={loading}
        >
          <span className="mr-2">{showForm ? '✕' : '+'}</span>
          {showForm ? 'Cancel' : 'Add New Event'}
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <p>{error}</p>
        </div>
      )}

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
                  maxLength={100}
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
                  maxLength={100}
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Start Date</label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2">End Date</label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  maxLength={1000}
                  placeholder="Enter event description..."
                />
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
                      <img src={logoPreview} alt="Logo preview" className="h-16 w-16 object-contain border rounded" />
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">Supported formats: JPG, PNG, GIF. Max size: 5MB</p>
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="mt-2">
                    <div className="bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
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
                className="mr-2 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded transition-colors disabled:opacity-50"
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
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="mt-2">Loading events...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No events found. Create your first event!</p>
          </div>
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
                  <tr key={event.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        {event.logoURL ? (
                          <img 
                            src={event.logoURL} 
                            alt={event.name} 
                            className="w-8 h-8 mr-2 object-contain rounded" 
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div className="w-8 h-8 mr-2 bg-gray-200 rounded-full flex items-center justify-center" style={{ display: event.logoURL ? 'none' : 'flex' }}>
                          <span>📅</span>
                        </div>
                        <span className="font-medium">{event.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">{event.theme}</td>
                    <td className="py-3 px-4">{formatDate(event.startDate)}</td>
                    <td className="py-3 px-4">{formatDate(event.endDate)}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        event.status === 'Completed' ? 'bg-green-100 text-green-800' : 
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {event.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex space-x-2">
                        <button 
                          className="text-blue-500 hover:text-blue-700 hover:scale-110 rounded-full p-1 hover:bg-blue-100 transition-all"
                          onClick={() => handleViewActivities(event.id)}
                          disabled={loading}
                          title="View Activities"
                        >
                          👁️
                        </button>
                        <button 
                          className="text-yellow-500 hover:text-yellow-700 hover:scale-110 rounded-full p-1 hover:bg-yellow-100 transition-all"
                          onClick={() => handleEditEvent(event)}
                          disabled={loading}
                          title="Edit Event"
                        >
                          📝
                        </button>
                        <button 
                          className="text-red-500 hover:text-red-700 hover:scale-110 rounded-full p-1 hover:bg-red-100 transition-all"
                          onClick={() => handleDeleteEvent(event.id, event.logoURL)}
                          disabled={loading}
                          title="Delete Event"
                        >
                          🗑️
                        </button>
                      </div>
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