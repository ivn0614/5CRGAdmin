import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { firestore, storage } from '../Firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy, getDoc } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

const PartnersPage = () => {
  const navigate = useNavigate();
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    companyDescription: '',
    website: '',
    facebook: '',
    instagram: '',
    twitter: '',
    youtube: '',
    logo: null
  });
  const [logoPreview, setLogoPreview] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPartnerId, setCurrentPartnerId] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // State for detailed view modal
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailPartner, setDetailPartner] = useState(null);

  useEffect(() => {
    // Fetch partners from Firestore
    const fetchPartners = async () => {
      try {
        const partnersCollection = collection(firestore, 'partners');
        const partnersQuery = query(partnersCollection, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(partnersQuery);
        
        const partnersArray = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setPartners(partnersArray);
      } catch (error) {
        console.error("Error fetching partners:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPartners();
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

  const uploadLogo = async (file, partnerId) => {
    if (!file) return null;
    
    try {
      // Create a unique filename with timestamp to avoid collisions
      const timestamp = new Date().getTime();
      const fileName = `${timestamp}_${file.name}`;
      const fileRef = storageRef(storage, `partner-logos/${partnerId}/${fileName}`);
      
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
      let partnerId = currentPartnerId;
      let logoURL = null;
      
      const partnerData = {
        name: formData.companyName,
        description: formData.companyDescription,
        website: formData.website,
        socialMedia: {
          facebook: formData.facebook,
          instagram: formData.instagram,
          twitter: formData.twitter,
          youtube: formData.youtube
        },
        updatedAt: new Date().toISOString()
      };
      
      // If creating new partner
      if (!isEditing) {
        partnerData.createdAt = new Date().toISOString();
        
        // First create the document to get an ID
        const docRef = await addDoc(collection(firestore, 'partners'), partnerData);
        partnerId = docRef.id;
        
        // Upload logo if there's a file
        if (formData.logo && formData.logo instanceof File) {
          logoURL = await uploadLogo(formData.logo, partnerId);
          
          // Update the document with the logo URL
          if (logoURL) {
            await updateDoc(doc(firestore, 'partners', partnerId), {
              logoURL: logoURL
            });
          }
        }
        
        // Refresh the partners list
        const updatedPartner = {
          id: partnerId,
          ...partnerData,
          logoURL: logoURL
        };
        
        setPartners([updatedPartner, ...partners]);
      } 
      // If editing existing partner
      else {
        // Upload new logo if there's a file
        if (formData.logo && formData.logo instanceof File) {
          logoURL = await uploadLogo(formData.logo, partnerId);
          partnerData.logoURL = logoURL;
        } else if (logoPreview && typeof logoPreview === 'string' && logoPreview.startsWith('http')) {
          // Keep existing logo URL
          partnerData.logoURL = logoPreview;
        }
        
        // Update the document
        await updateDoc(doc(firestore, 'partners', partnerId), partnerData);
        
        // Update local state
        setPartners(partners.map(partner => 
          partner.id === partnerId ? { ...partner, ...partnerData } : partner
        ));
      }

      // Reset form and state
      resetForm();
      
      // Show success message
      alert("Partner saved successfully!");
    } catch (error) {
      console.error("Error saving partner:", error);
      alert("Failed to save partner. Please try again.");
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const resetForm = () => {
    setFormData({
      companyName: '',
      companyDescription: '',
      website: '',
      facebook: '',
      instagram: '',
      twitter: '',
      youtube: '',
      logo: null
    });
    setLogoPreview(null);
    setShowForm(false);
    setIsEditing(false);
    setCurrentPartnerId(null);
    setUploadProgress(0);
  };

  const handleEditPartner = (partner) => {
    setCurrentPartnerId(partner.id);
    setFormData({
      companyName: partner.name,
      companyDescription: partner.description,
      website: partner.website || '',
      facebook: partner.socialMedia?.facebook || '',
      instagram: partner.socialMedia?.instagram || '',
      twitter: partner.socialMedia?.twitter || '',
      youtube: partner.socialMedia?.youtube || '',
      logo: null // We don't set the file object when editing
    });
    
    if (partner.logoURL) {
      setLogoPreview(partner.logoURL);
    }
    
    setIsEditing(true);
    setShowForm(true);
  };

  const handleDeletePartner = async (partnerId, logoURL) => {
    if (!window.confirm('Are you sure you want to delete this partner?')) return;
    
    setLoading(true);
    
    try {
      // Delete the partner from Firestore
      await deleteDoc(doc(firestore, 'partners', partnerId));
      
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
      setPartners(partners.filter(partner => partner.id !== partnerId));
      
      // Show success message
      alert("Partner deleted successfully!");
    } catch (error) {
      console.error("Error deleting partner:", error);
      alert("Failed to delete partner. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleViewPartnerDetails = async (partnerId) => {
    try {
      const partnerDoc = doc(firestore, 'partners', partnerId);
      const partnerSnapshot = await getDoc(partnerDoc);
      
      if (partnerSnapshot.exists()) {
        const partnerData = partnerSnapshot.data();
        setDetailPartner({
          ...partnerData,
          id: partnerId
        });
        setShowDetailModal(true);
      } else {
        alert("Partner not found!");
      }
    } catch (error) {
      console.error("Error fetching partner details:", error);
      alert("Failed to fetch partner details.");
    }
  };

  // Helper to check if URL is valid
  const isValidUrl = (url) => {
    if (!url) return true; // Empty is fine
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  };

  // Helper to format URLs with proper protocol
  const formatUrl = (url) => {
    if (!url) return '';
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return `https://${url}`;
    }
    return url;
  };

  // Component for detail modal
  const DetailModal = ({ partner, onClose }) => {
    if (!partner) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-screen overflow-auto">
          <div className="sticky top-0 bg-white p-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-bold text-navy-900">{partner.name}</h2>
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
            <div className="flex items-center mb-6">
              {partner.logoURL ? (
                <img 
                  src={partner.logoURL} 
                  alt={`${partner.name} logo`} 
                  className="w-24 h-24 object-contain rounded-lg mr-4"
                />
              ) : (
                <div className="w-24 h-24 bg-gray-200 rounded-lg flex items-center justify-center mr-4">
                  <span className="text-3xl">🏢</span>
                </div>
              )}
              
              <div>
                <h3 className="text-lg font-semibold">{partner.name}</h3>
                {partner.website && (
                  <a 
                    href={formatUrl(partner.website)} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-blue-500 hover:underline mt-1 inline-block"
                  >
                    Visit Website
                  </a>
                )}
              </div>
            </div>
            
            {/* Description */}
            <div className="mb-6">
              <h3 className="font-semibold text-lg mb-2">About {partner.name}</h3>
              <div className="prose max-w-none">
                {/* Render description with line breaks */}
                {partner.description.split('\n').map((paragraph, idx) => (
                  paragraph ? <p key={idx} className="mb-4">{paragraph}</p> : <br key={idx} />
                ))}
              </div>
            </div>
            
            {/* Social Media */}
            {(partner.socialMedia?.facebook || partner.socialMedia?.instagram || 
              partner.socialMedia?.twitter || partner.socialMedia?.youtube) && (
              <div className="mb-6">
                <h3 className="font-semibold text-lg mb-3">Connect with {partner.name}</h3>
                <div className="flex flex-wrap gap-3">
                  {partner.socialMedia?.facebook && (
                    <a 
                      href={formatUrl(partner.socialMedia.facebook)} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="bg-blue-600 text-white px-4 py-2 rounded-full flex items-center hover:bg-blue-700"
                    >
                      <span>Facebook</span>
                    </a>
                  )}
                  
                  {partner.socialMedia?.instagram && (
                    <a 
                      href={formatUrl(partner.socialMedia.instagram)} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="bg-pink-600 text-white px-4 py-2 rounded-full flex items-center hover:bg-pink-700"
                    >
                      <span>Instagram</span>
                    </a>
                  )}
                  
                  {partner.socialMedia?.twitter && (
                    <a 
                      href={formatUrl(partner.socialMedia.twitter)} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="bg-blue-400 text-white px-4 py-2 rounded-full flex items-center hover:bg-blue-500"
                    >
                      <span>Twitter</span>
                    </a>
                  )}
                  
                  {partner.socialMedia?.youtube && (
                    <a 
                      href={formatUrl(partner.socialMedia.youtube)} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="bg-red-600 text-white px-4 py-2 rounded-full flex items-center hover:bg-red-700"
                    >
                      <span>YouTube</span>
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end">
            <button
              onClick={() => handleEditPartner(partner)}
              className="bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-4 rounded mr-2"
            >
              Edit Partner
            </button>
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
          <h1 className="text-2xl font-bold text-navy-900">Partners Management</h1>
          <p className="text-gray-600">Manage 5th CRG partners</p>
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
          {showForm ? 'Cancel' : 'Add New Partner'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-navy-900 mb-4">
            {isEditing ? 'Edit Partner' : 'Add New Partner'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-700 mb-2">Company Name *</label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Website</label>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleInputChange}
                  placeholder="https://example.com"
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-gray-700 mb-2">Company Description *</label>
                <textarea
                  name="companyDescription"
                  value={formData.companyDescription}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 h-32"
                  required
                  disabled={loading}
                ></textarea>
              </div>
              
              <div className="md:col-span-2">
                <h3 className="text-lg font-semibold text-navy-900 mb-2">Social Media Links</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 mb-2">
                      <span className="mr-2">Facebook</span>
                    </label>
                    <input
                      type="text"
                      name="facebook"
                      value={formData.facebook}
                      onChange={handleInputChange}
                      placeholder="https://facebook.com/companyname"
                      className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-2">
                      <span className="mr-2">Instagram</span>
                    </label>
                    <input
                      type="text"
                      name="instagram"
                      value={formData.instagram}
                      onChange={handleInputChange}
                      placeholder="https://instagram.com/companyname"
                      className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-2">
                      <span className="mr-2">Twitter</span>
                    </label>
                    <input
                      type="text"
                      name="twitter"
                      value={formData.twitter}
                      onChange={handleInputChange}
                      placeholder="https://twitter.com/companyname"
                      className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-2">
                      <span className="mr-2">YouTube</span>
                    </label>
                    <input
                      type="text"
                      name="youtube"
                      value={formData.youtube}
                      onChange={handleInputChange}
                      placeholder="https://youtube.com/channel/channelid"
                      className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-gray-700 mb-2">Company Logo</label>
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
                {loading ? 'Saving...' : isEditing ? 'Update Partner' : 'Save Partner'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-navy-900 mb-4">Partners List</h2>
        {loading && !showForm ? (
          <div className="text-center py-4">
            <p>Loading partners...</p>
          </div>
        ) : partners.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No partners found. Add your first partner!</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr className="bg-gray-100 text-gray-600 text-left">
                  <th className="py-3 px-4 font-semibold">Company</th>
                  <th className="py-3 px-4 font-semibold">Description</th>
                  <th className="py-3 px-4 font-semibold">Website</th>
                  <th className="py-3 px-4 font-semibold">Social Media</th>
                  <th className="py-3 px-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="text-gray-600">
                {partners.map((partner) => (
                  <tr key={partner.id} className="border-b border-gray-200">
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        {partner.logoURL ? (
                          <img src={partner.logoURL} alt={partner.name} className="w-8 h-8 mr-2 object-contain" />
                        ) : (
                          <div className="w-8 h-8 mr-2 bg-gray-200 rounded-full flex items-center justify-center">
                            <span>🏢</span>
                          </div>
                        )}
                        {partner.name}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {partner.description && partner.description.length > 50 
                        ? `${partner.description.substring(0, 50)}...` 
                        : partner.description}
                    </td>
                    <td className="py-3 px-4">
                      {partner.website ? (
                        <a 
                          href={formatUrl(partner.website)} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline"
                        >
                          Visit
                        </a>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex space-x-2">
                        {partner.socialMedia?.facebook && (
                          <a 
                            href={formatUrl(partner.socialMedia.facebook)} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800"
                          >
                            FB
                          </a>
                        )}
                        {partner.socialMedia?.instagram && (
                          <a 
                            href={formatUrl(partner.socialMedia.instagram)} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-pink-600 hover:text-pink-800"
                          >
                            IG
                          </a>
                        )}
                        {partner.socialMedia?.twitter && (
                          <a 
                            href={formatUrl(partner.socialMedia.twitter)} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-600"
                          >
                            TW
                          </a>
                        )}
                        {partner.socialMedia?.youtube && (
                          <a 
                            href={formatUrl(partner.socialMedia.youtube)} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-red-600 hover:text-red-800"
                          >
                            YT
                          </a>
                        )}
                        {!partner.socialMedia?.facebook && 
                         !partner.socialMedia?.instagram && 
                         !partner.socialMedia?.twitter && 
                         !partner.socialMedia?.youtube && (
                          <span className="text-gray-400">-</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <button 
                        className="text-blue-500 hover:text-blue-700 hover:scale-110 mr-2 rounded-full p-1 hover:bg-blue-200"
                        onClick={() => handleViewPartnerDetails(partner.id)}
                        disabled={loading}
                        title="View Details"
                      >
                        👁️
                      </button>
                      <button 
                        className="text-yellow-500 hover:text-yellow-700 hover:scale-110 mr-2 rounded-full p-1 hover:bg-yellow-200"
                        onClick={() => handleEditPartner(partner)}
                        disabled={loading}
                        title="Edit Partner"
                      >
                        📝
                      </button>
                      <button 
                        className="text-red-500 hover:text-red-700 hover:scale-110 mr-2 rounded-full p-1 hover:bg-red-200"
                        onClick={() => handleDeletePartner(partner.id, partner.logoURL)}
                        disabled={loading}
                        title="Delete Partner"
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
      {showDetailModal && detailPartner && (
        <DetailModal 
          partner={detailPartner} 
          onClose={() => {
            setShowDetailModal(false);
            setDetailPartner(null);
          }} 
        />
      )}
    </Layout>
  );
};

export default PartnersPage;