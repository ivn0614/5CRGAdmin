import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Layout from '../components/Layout';
import { firestore, storage } from '../Firebase';
import { 
  collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, 
  orderBy, where, getDoc 
} from 'firebase/firestore';
import { 
  ref as storageRef, uploadBytes, getDownloadURL, deleteObject 
} from 'firebase/storage';

const ActivitiesPage = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const eventId = queryParams.get('eventId');

  const [events, setEvents] = useState([]);
  const [activities, setActivities] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(eventId || '');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailContent, setDetailContent] = useState(null);
  const [formData, setFormData] = useState({
    activityName: '',
    theme: '',
    description: '',
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    pictures: []
  });
  const [picturePreview, setPicturePreview] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentActivityId, setCurrentActivityId] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
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
      }
    };
    
    const fetchActivities = async () => {
      try {
        const activitiesCollection = collection(firestore, 'activities');
        let activitiesQuery;
        
        if (eventId) {
          activitiesQuery = query(
            activitiesCollection, 
            where('eventId', '==', eventId),
            orderBy('createdAt', 'desc')
          );
        } else {
          activitiesQuery = query(activitiesCollection, orderBy('createdAt', 'desc'));
        }
        
        const snapshot = await getDocs(activitiesQuery);
        
        const activitiesArray = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setActivities(activitiesArray);
      } catch (error) {
        console.error("Error fetching activities:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchEvents();
    fetchActivities();
    
    if (eventId) {
      setSelectedEvent(eventId);
    }
  }, [eventId]);

  const filteredActivities = selectedEvent 
    ? activities.filter(activity => activity.eventId === selectedEvent)
    : activities;

  const selectedEventDetails = events.find(event => event.id === selectedEvent);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handlePicturesChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setFormData({
        ...formData,
        pictures: [...formData.pictures, ...files]
      });

      files.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPicturePreview(prev => [...prev, reader.result]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removePicture = (index) => {
    const updatedPictures = [...formData.pictures];
    const updatedPreviews = [...picturePreview];
    updatedPictures.splice(index, 1);
    updatedPreviews.splice(index, 1);
    setFormData({
      ...formData,
      pictures: updatedPictures
    });
    setPicturePreview(updatedPreviews);
  };

  const uploadPictures = async (files, activityId) => {
    if (!files || files.length === 0) return [];
    
    const uploadedUrls = [];
    const totalFiles = files.length;
    let uploadedCount = 0;
    
    try {
      for (const file of files) {
        if (file instanceof File) {
          const timestamp = new Date().getTime();
          const fileName = `${timestamp}_${file.name}`;
          const fileRef = storageRef(storage, `activity-images/${activityId}/${fileName}`);
          
          await uploadBytes(fileRef, file);
          
          const downloadURL = await getDownloadURL(fileRef);
          
          uploadedUrls.push(downloadURL);
          
          uploadedCount++;
          setUploadProgress(Math.round((uploadedCount / totalFiles) * 100));
        } else if (typeof file === 'string' && file.startsWith('http')) {
          uploadedUrls.push(file);
        }
      }
      
      return uploadedUrls;
    } catch (error) {
      console.error("Error uploading pictures:", error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedEvent) {
      alert('Please select an event first');
      return;
    }
    
    setLoading(true);
    setUploadProgress(0);
    
    try {
      let activityId = currentActivityId;
      let pictureURLs = [];
      
      const activityData = {
        name: formData.activityName,
        theme: formData.theme,
        description: formData.description,
        startDate: formData.startDate,
        endDate: formData.endDate,
        startTime: formData.startTime,
        endTime: formData.endTime,
        eventId: selectedEvent,
        updatedAt: new Date().toISOString()
      };
      

      if (!isEditing) {
        activityData.createdAt = new Date().toISOString();
        
        const docRef = await addDoc(collection(firestore, 'activities'), activityData);
        activityId = docRef.id;
        
        if (formData.pictures && formData.pictures.length > 0) {
          pictureURLs = await uploadPictures(formData.pictures, activityId);
          
          if (pictureURLs.length > 0) {
            await updateDoc(doc(firestore, 'activities', activityId), {
              pictureURLs: pictureURLs
            });
          }
        }
        
        const updatedActivity = {
          id: activityId,
          ...activityData,
          pictureURLs: pictureURLs
        };
        
        setActivities([updatedActivity, ...activities]);
      } 
      else {
        let existingUrls = [];
        
        const existingPics = picturePreview.filter(pic => typeof pic === 'string' && pic.startsWith('http'));
        existingUrls = existingPics;
        
        const newPics = formData.pictures.filter(pic => pic instanceof File);
        if (newPics.length > 0) {
          const newUrls = await uploadPictures(newPics, activityId);
          pictureURLs = [...existingUrls, ...newUrls];
        } else {
          pictureURLs = existingUrls;
        }
        
        activityData.pictureURLs = pictureURLs;
        
        await updateDoc(doc(firestore, 'activities', activityId), activityData);
        
        setActivities(activities.map(activity => 
          activity.id === activityId ? { ...activity, ...activityData } : activity
        ));
      }
      
      resetForm();
      
      alert("Activity saved successfully!");
    } catch (error) {
      console.error("Error saving activity:", error);
      alert("Failed to save activity. Please try again.");
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const resetForm = () => {
    setFormData({
      activityName: '',
      theme: '',
      description: '',
      startDate: '',
      endDate: '',
      startTime: '',
      endTime: '',
      pictures: []
    });
    setPicturePreview([]);
    setShowForm(false);
    setIsEditing(false);
    setCurrentActivityId(null);
    setUploadProgress(0);
  };

  const handleEditActivity = (activity) => {
    setCurrentActivityId(activity.id);
    setFormData({
      activityName: activity.name,
      theme: activity.theme,
      description: activity.description,
      startDate: activity.startDate,
      endDate: activity.endDate,
      startTime: activity.startTime,
      endTime: activity.endTime,
      pictures: []
    });
    
    if (activity.pictureURLs && activity.pictureURLs.length > 0) {
      setPicturePreview(activity.pictureURLs);
    } else {
      setPicturePreview([]);
    }
    
    setSelectedEvent(activity.eventId);
    setIsEditing(true);
    setShowForm(true);
  };

  const handleDeleteActivity = async (activityId, pictureURLs) => {
    if (!window.confirm('Are you sure you want to delete this activity?')) return;
    
    setLoading(true);
    
    try {
      await deleteDoc(doc(firestore, 'activities', activityId));
      
      if (pictureURLs && pictureURLs.length > 0) {
        try {
          for (const url of pictureURLs) {
            const picPath = decodeURIComponent(url.split('/o/')[1].split('?')[0]);
            const fileRef = storageRef(storage, picPath);
            await deleteObject(fileRef);
          }
        } catch (error) {
          console.error("Error deleting pictures:", error);
        }
      }
    
      setActivities(activities.filter(activity => activity.id !== activityId));
      

      alert("Activity deleted successfully!");
    } catch (error) {
      console.error("Error deleting activity:", error);
      alert("Failed to delete activity. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleViewActivityDetails = async (activityId) => {
    try {
      const activityDoc = doc(firestore, 'activities', activityId);
      const activitySnapshot = await getDoc(activityDoc);
      
      if (activitySnapshot.exists()) {
        const activityData = activitySnapshot.data();
        setDetailContent({
          ...activityData,
          id: activityId
        });
        setShowDetailModal(true);
      } else {
        alert("Activity not found!");
      }
    } catch (error) {
      console.error("Error fetching activity details:", error);
      alert("Failed to fetch activity details.");
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getEventName = (eventId) => {
    const event = events.find(e => e.id === eventId);
    return event ? event.name : 'Unknown Event';
  };

const DetailModal = ({ content, onClose }) => {
  if (!content) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-screen overflow-auto">
        <div className="sticky top-0 bg-white p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-bold text-navy-900">{content.name}</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        
        <div className="p-6">
          <div className="mb-6">
            <div className="flex flex-wrap items-center text-sm text-gray-600 mb-4">
              <div className="mr-6 mb-2">
                <span className="font-semibold">Theme:</span> {content.theme}
              </div>
              <div className="mr-6 mb-2">
                <span className="font-semibold">Event:</span> {getEventName(content.eventId)}
              </div>
              <div className="mr-6 mb-2">
                <span className="font-semibold">Date:</span> {content.startDate === content.endDate 
                  ? formatDate(content.startDate) 
                  : `${formatDate(content.startDate)} to ${formatDate(content.endDate)}`}
              </div>
              <div className="mb-2">
                <span className="font-semibold">Time:</span> {content.startTime} - {content.endTime}
              </div>
            </div>
            
            <div className="prose max-w-none mb-8">
              <h3 className="text-lg font-semibold mb-2">Description</h3>
             
              {content.description.split('\n').map((paragraph, idx) => (
                paragraph ? <p key={idx} className="mb-4">{paragraph}</p> : <br key={idx} />
              ))}
            </div>
          </div>
          
          {/* Images */}
          {content.pictureURLs && content.pictureURLs.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3">Images</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {content.pictureURLs.map((url, idx) => (
                  <div key={idx} className="relative">
                    <img 
                      src={url} 
                      alt={`${content.name} ${idx+1}`}
                      className="w-full h-64 object-cover rounded-lg shadow-md" 
                    />
                    <a 
                      href={url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="absolute bottom-2 right-2 bg-white bg-opacity-75 p-2 rounded-full shadow-md hover:bg-opacity-100"
                      title="View full size image"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                      </svg>
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Activities Management</h1>
          <p className="text-gray-600">Create and manage activities for events</p>
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
          {showForm ? 'Cancel' : 'Add New Activity'}
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-bold text-navy-900 mb-4">Filter by Event</h2>
        <select
          value={selectedEvent}
          onChange={(e) => setSelectedEvent(e.target.value)}
          className="w-full md:w-1/2 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loading}
        >
          <option value="">All Events</option>
          {events.map((event) => (
            <option key={event.id} value={event.id}>
              {event.name} ({formatDate(event.startDate)} to {formatDate(event.endDate)})
            </option>
          ))}
        </select>
        
        {selectedEventDetails && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-lg">{selectedEventDetails.name}</h3>
            <p className="text-gray-600">Theme: {selectedEventDetails.theme}</p>
            <p className="text-gray-600">Dates: {formatDate(selectedEventDetails.startDate)} to {formatDate(selectedEventDetails.endDate)}</p>
          </div>
        )}
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-navy-900 mb-4">
            {isEditing ? 'Edit Activity' : 'Create New Activity'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-gray-700 mb-2">Select Event *</label>
                <select
                  value={selectedEvent}
                  onChange={(e) => setSelectedEvent(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={loading}
                >
                  <option value="">-- Select Event --</option>
                  {events.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.name} ({formatDate(event.startDate)} to {formatDate(event.endDate)})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Activity Name *</label>
                <input
                  type="text"
                  name="activityName"
                  value={formData.activityName}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Activity Theme *</label>
                <input
                  type="text"
                  name="theme"
                  value={formData.theme}
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
              <div>
                <label className="block text-gray-700 mb-2">Start Time *</label>
                <input
                  type="time"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2">End Time *</label>
                <input
                  type="time"
                  name="endTime"
                  value={formData.endTime}
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
                <label className="block text-gray-700 mb-2">Activity Pictures</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePicturesChange}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                />
                
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="mt-2">
                    <div className="bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-green-600 h-2.5 rounded-full" 
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Uploading: {Math.round(uploadProgress)}%</p>
                  </div>
                )}
                
                {picturePreview.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                    {picturePreview.map((src, index) => (
                      <div key={index} className="relative">
                        <img src={src} alt={`Preview ${index}`} className="h-24 w-full object-cover rounded" />
                        <button
                          type="button"
                          onClick={() => removePicture(index)}
                          className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                          disabled={loading}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
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
                {loading ? 'Saving...' : isEditing ? 'Update Activity' : 'Save Activity'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-navy-900 mb-4">Activities List</h2>
        {loading && !showForm ? (
          <div className="text-center py-4">
            <p>Loading activities...</p>
          </div>
        ) : filteredActivities.length === 0 ? (
          <p className="text-gray-500 text-center py-4">
            {selectedEvent ? 'No activities found for this event. Create your first activity!' : 'No activities found. Select an event or create a new activity.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr className="bg-gray-100 text-gray-600 text-left">
                  <th className="py-3 px-4 font-semibold">Activity Name</th>
                  <th className="py-3 px-4 font-semibold">Theme</th>
                  <th className="py-3 px-4 font-semibold">Event</th>
                  <th className="py-3 px-4 font-semibold">Date</th>
                  <th className="py-3 px-4 font-semibold">Time</th>
                  <th className="py-3 px-4 font-semibold">Images</th>
                  <th className="py-3 px-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="text-gray-600">
                {filteredActivities.map((activity) => (
                  <tr key={activity.id} className="border-b border-gray-200">
                    <td className="py-3 px-4">{activity.name}</td>
                    <td className="py-3 px-4">{activity.theme}</td>
                    <td className="py-3 px-4">{getEventName(activity.eventId)}</td>
                    <td className="py-3 px-4">
                      {activity.startDate === activity.endDate 
                        ? formatDate(activity.startDate) 
                        : `${formatDate(activity.startDate)} to ${formatDate(activity.endDate)}`}
                    </td>
                    <td className="py-3 px-4">{activity.startTime} - {activity.endTime}</td>
                    <td className="py-3 px-4">
                      {activity.pictureURLs && activity.pictureURLs.length > 0 ? (
                        <div className="flex space-x-1">
                          {activity.pictureURLs.slice(0, 2).map((url, idx) => (
                            <img 
                              key={idx} 
                              src={url} 
                              alt={`${activity.name} ${idx+1}`} 
                              className="w-8 h-8 object-cover rounded"
                            />
                          ))}
                          {activity.pictureURLs.length > 2 && (
                            <span className="bg-gray-200 w-8 h-8 rounded flex items-center justify-center text-xs">
                              +{activity.pictureURLs.length - 2}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">No images</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <button 
                        className="text-red-500 hover:text-blue-700 hover:scale-110 mr-2 rounded-full p-1 hover:bg-blue-200"
                        onClick={() => handleViewActivityDetails(activity.id)}
                        disabled={loading}
                      >
                        👁️
                      </button>
                      <button 
                        className="text-red-500 hover:text-blue-700 hover:scale-110 mr-2 rounded-full p-1 hover:bg-yellow-200"
                        onClick={() => handleEditActivity(activity)}
                        disabled={loading}
                      >
                        📝
                      </button>
                      <button 
                        className="text-red-500 hover:text-blue-700 hover:scale-110 mr-2 rounded-full p-1 hover:bg-red-200"
                        onClick={() => handleDeleteActivity(activity.id, activity.pictureURLs)}
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
      
      {showDetailModal && detailContent && (
        <DetailModal 
          content={detailContent} 
          onClose={() => {
            setShowDetailModal(false);
            setDetailContent(null);
          }} 
        />
      )}
    </Layout>
  );
};

export default ActivitiesPage;