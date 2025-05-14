import React, { useState, useEffect } from 'react';
import { firestore, storage } from '../Firebase';
import { 
  collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, 
  orderBy, getDoc 
} from 'firebase/firestore';
import { 
  ref as storageRef, uploadBytes, getDownloadURL, deleteObject 
} from 'firebase/storage';
import Layout from '../components/Layout';

const AdsPage = () => {
  const [ads, setAds] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    description: '',
    startDate: '',
    endDate: '',
    url: '',
    position: '',
    isActive: true,
    image: null
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [currentAdId, setCurrentAdId] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // State for detailed view modal
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailAd, setDetailAd] = useState(null);

  useEffect(() => {
    // Fetch ads from Firestore
    const fetchAds = async () => {
      try {
        const adsCollection = collection(firestore, 'ads');
        const adsQuery = query(adsCollection, orderBy('startDate', 'desc'));
        const snapshot = await getDocs(adsQuery);
        
        const adsArray = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setAds(adsArray);
      } catch (error) {
        console.error("Error fetching ads:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAds();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({
        ...formData,
        image: file
      });
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setFormData({
      ...formData,
      image: null
    });
    setImagePreview(null);
  };

  const uploadImage = async (file, adId) => {
    if (!file) return null;
    
    try {
      // Only process actual File objects (not existing URLs)
      if (file instanceof File) {
        // Create a unique filename with timestamp to avoid collisions
        const timestamp = new Date().getTime();
        const fileName = `${timestamp}_${file.name}`;
        const fileRef = storageRef(storage, `ad-images/${adId}/${fileName}`);
        
        // Upload the file
        await uploadBytes(fileRef, file);
        
        // Get the download URL
        const downloadURL = await getDownloadURL(fileRef);
        
        setUploadProgress(100);
        return downloadURL;
      } else if (typeof file === 'string' && file.startsWith('http')) {
        // Keep existing URL
        return file;
      }
      
      return null;
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setLoading(true);
    setUploadProgress(0);
    
    try {
      let adId = currentAdId;
      let imageURL = null;
      
      const adData = {
        title: formData.title,
        company: formData.company,
        description: formData.description,
        startDate: formData.startDate,
        endDate: formData.endDate,
        url: formData.url,
        position: formData.position,
        isActive: formData.isActive,
        updatedAt: new Date().toISOString()
      };
      
      // If creating new ad
      if (!isEditing) {
        adData.createdAt = new Date().toISOString();
        
        // First create the document to get an ID
        const docRef = await addDoc(collection(firestore, 'ads'), adData);
        adId = docRef.id;
        
        // Upload image if there is a file
        if (formData.image) {
          imageURL = await uploadImage(formData.image, adId);
          
          // Update the document with the image URL
          if (imageURL) {
            await updateDoc(doc(firestore, 'ads', adId), {
              imageURL: imageURL
            });
          }
        }
        
        // Refresh the ad list
        const updatedAd = {
          id: adId,
          ...adData,
          imageURL: imageURL
        };
        
        setAds([updatedAd, ...ads]);
      } 
      // If editing existing ad
      else {
        // Upload new image if there is a file
        if (formData.image) {
          if (formData.image instanceof File) {
            imageURL = await uploadImage(formData.image, adId);
            adData.imageURL = imageURL;
          } else if (typeof formData.image === 'string') {
            adData.imageURL = formData.image;
          }
        }
        
        // Update the document
        await updateDoc(doc(firestore, 'ads', adId), adData);
        
        // Update local state
        setAds(ads.map(item => 
          item.id === adId ? { ...item, ...adData } : item
        ));
      }
      
      // Reset form and state
      resetForm();
      
      // Show success message
      alert("Ad saved successfully!");
    } catch (error) {
      console.error("Error saving ad:", error);
      alert("Failed to save ad. Please try again.");
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      company: '',
      description: '',
      startDate: '',
      endDate: '',
      url: '',
      position: '',
      isActive: true,
      image: null
    });
    setImagePreview(null);
    setShowForm(false);
    setIsEditing(false);
    setCurrentAdId(null);
    setUploadProgress(0);
  };

  const handleEditAd = (item) => {
    setCurrentAdId(item.id);
    setFormData({
      title: item.title,
      company: item.company,
      description: item.description,
      startDate: item.startDate,
      endDate: item.endDate,
      url: item.url,
      position: item.position || '',
      isActive: item.isActive !== false, // Default to true if not specified
      image: item.imageURL || null
    });
    
    // Set image preview from existing URL
    if (item.imageURL) {
      setImagePreview(item.imageURL);
    } else {
      setImagePreview(null);
    }
    
    setIsEditing(true);
    setShowForm(true);
  };

  const handleDeleteAd = async (adId, imageURL) => {
    if (!window.confirm('Are you sure you want to delete this ad?')) return;
    
    setLoading(true);
    
    try {
      // Delete the ad from Firestore
      await deleteDoc(doc(firestore, 'ads', adId));
      
      // Delete the image from storage if it exists
      if (imageURL) {
        try {
          // Extract the path from the URL
          const picPath = decodeURIComponent(imageURL.split('/o/')[1].split('?')[0]);
          const fileRef = storageRef(storage, picPath);
          await deleteObject(fileRef);
        } catch (error) {
          console.error("Error deleting image:", error);
          // Continue even if image deletion fails
        }
      }
      
      // Update local state
      setAds(ads.filter(item => item.id !== adId));
      
      // Show success message
      alert("Ad deleted successfully!");
    } catch (error) {
      console.error("Error deleting ad:", error);
      alert("Failed to delete ad. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleViewAdDetails = async (adId) => {
    try {
      const adDoc = doc(firestore, 'ads', adId);
      const adSnapshot = await getDoc(adDoc);
      
      if (adSnapshot.exists()) {
        const adData = adSnapshot.data();
        setDetailAd({
          ...adData,
          id: adId
        });
        setShowDetailModal(true);
      } else {
        alert("Ad not found!");
      }
    } catch (error) {
      console.error("Error fetching ad details:", error);
      alert("Failed to fetch ad details.");
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Component for detail modal
  const DetailModal = ({ ad, onClose }) => {
    if (!ad) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-screen overflow-auto">
          <div className="sticky top-0 bg-white p-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-bold text-navy-900">{ad.title}</h2>
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
                  <span className="font-semibold">Company:</span> {ad.company}
                </div>
                <div className="mr-6 mb-2">
                  <span className="font-semibold">Position:</span> {ad.position || 'Not specified'}
                </div>
                <div className="mb-2">
                  <span className="font-semibold">Status:</span> 
                  <span className={`ml-1 px-2 py-1 rounded text-xs ${ad.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {ad.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              
              <div className="mb-4">
                <span className="font-semibold">Duration:</span> {formatDate(ad.startDate)} - {formatDate(ad.endDate)}
              </div>
              
              {ad.url && (
                <div className="mb-4">
                  <span className="font-semibold">URL:</span> 
                  <a href={ad.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline ml-1">
                    {ad.url}
                  </a>
                </div>
              )}
              
              {/* Description */}
              <div className="mt-4">
                <h3 className="font-semibold text-lg mb-2">Description</h3>
                <div className="prose max-w-none">
                  {/* Render description with line breaks */}
                  {ad.description.split('\n').map((paragraph, idx) => (
                    paragraph ? <p key={idx} className="mb-4">{paragraph}</p> : <br key={idx} />
                  ))}
                </div>
              </div>
            </div>
            
            {/* Image */}
            {ad.imageURL && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-3">Ad Image</h3>
                <div className="relative">
                  <img 
                    src={ad.imageURL} 
                    alt={`${ad.title} ad`}
                    className="w-full max-h-96 object-contain rounded-lg shadow-md" 
                  />
                  <a 
                    href={ad.imageURL} 
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
          <h1 className="text-2xl font-bold text-navy-900">Ads Management</h1>
          <p className="text-gray-600">Create and manage advertisements for your blog</p>
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
          {showForm ? 'Cancel' : 'Add New Ad'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-navy-900 mb-4">
            {isEditing ? 'Edit Advertisement' : 'Create New Advertisement'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-gray-700 mb-2">Ad Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Company *</label>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Position in Blog</label>
                <select
                  name="position"
                  value={formData.position}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                >
                  <option value="">Select Position</option>
                  <option value="sidebar">Sidebar</option>
                  <option value="header">Header</option>
                  <option value="footer">Footer</option>
                  <option value="inContent">In Content</option>
                  <option value="popup">Popup</option>
                </select>
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
                <label className="block text-gray-700 mb-2">Destination URL *</label>
                <input
                  type="url"
                  name="url"
                  value={formData.url}
                  onChange={handleInputChange}
                  placeholder="https://example.com"
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={loading}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-gray-700 mb-2">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 h-32"
                  disabled={loading}
                ></textarea>
              </div>
              <div className="md:col-span-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    disabled={loading}
                  />
                  <label htmlFor="isActive" className="ml-2 block text-gray-700">
                    Active (Will be displayed on the blog)
                  </label>
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-gray-700 mb-2">Ad Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
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
                
                {imagePreview && (
                  <div className="mt-4 relative inline-block">
                    <img src={imagePreview} alt="Ad Preview" className="h-48 object-contain rounded" />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                      disabled={loading}
                    >
                      ✕
                    </button>
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
                {loading ? 'Saving...' : isEditing ? 'Update Ad' : 'Create Ad'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-navy-900 mb-4">All Advertisements</h2>
        {loading && !showForm ? (
          <div className="text-center py-4">
            <p>Loading advertisements...</p>
          </div>
        ) : ads.length === 0 ? (
          <p className="text-gray-500 text-center py-4">
            No advertisements found. Create your first ad!
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr className="bg-gray-100 text-gray-600 text-left">
                  <th className="py-3 px-4 font-semibold">Title</th>
                  <th className="py-3 px-4 font-semibold">Company</th>
                  <th className="py-3 px-4 font-semibold">Position</th>
                  <th className="py-3 px-4 font-semibold">Duration</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Image</th>
                  <th className="py-3 px-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="text-gray-600">
                {ads.map((ad) => (
                  <tr key={ad.id} className="border-b border-gray-200">
                    <td className="py-3 px-4">{ad.title}</td>
                    <td className="py-3 px-4">{ad.company}</td>
                    <td className="py-3 px-4">{ad.position || 'Not set'}</td>
                    <td className="py-3 px-4">
                      <div className="text-xs">
                        <div>From: {formatDate(ad.startDate)}</div>
                        <div>To: {formatDate(ad.endDate)}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs ${ad.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {ad.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {ad.imageURL ? (
                        <img 
                          src={ad.imageURL} 
                          alt={`${ad.title} ad`} 
                          className="w-8 h-8 object-cover rounded"
                        />
                      ) : (
                        <span className="text-gray-400">No image</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <button 
                        className="text-red-500 hover:text-blue-700 hover:scale-110 mr-2 rounded-full p-1 hover:bg-blue-200"
                        onClick={() => handleViewAdDetails(ad.id)}
                        disabled={loading}
                        title="View Details"
                      >
                        👁️
                      </button>
                      <button 
                        className="text-red-500 hover:text-blue-700 hover:scale-110 mr-2 rounded-full p-1 hover:bg-yellow-200"
                        onClick={() => handleEditAd(ad)}
                        disabled={loading}
                        title="Edit Ad"
                      >
                        📝
                      </button>
                      <button 
                        className="text-red-500 hover:text-blue-700 hover:scale-110 mr-2 rounded-full p-1 hover:bg-red-200"
                        onClick={() => handleDeleteAd(ad.id, ad.imageURL)}
                        disabled={loading}
                        title="Delete Ad"
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
      
      {/* Detail modal */}
      {showDetailModal && detailAd && (
        <DetailModal 
          ad={detailAd} 
          onClose={() => {
            setShowDetailModal(false);
            setDetailAd(null);
          }} 
        />
      )}
    </Layout>
  );
};

export default AdsPage;