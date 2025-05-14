import React, { useState, useEffect } from 'react';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  listAll,
} from "firebase/storage";
import { storage } from "./Firebase"; // Using your existing storage reference
import { v4 as uuidv4 } from "uuid"; // Make sure to install uuid package

const ImageUploader = ({ folderPath = "images", onImageUpload = null }) => {
  const [imageUpload, setImageUpload] = useState(null);
  const [imageUrls, setImageUrls] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  
  const imagesListRef = ref(storage, folderPath);

  // Load existing images on component mount
  useEffect(() => {
    listAll(imagesListRef).then((response) => {
      const urlPromises = response.items.map((item) => getDownloadURL(item));
      Promise.all(urlPromises).then((urls) => {
        setImageUrls(urls);
      });
    }).catch(error => {
      console.error("Error fetching images:", error);
    });
  }, [imagesListRef]);

  // Handle file selection
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setImageUpload(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Upload the selected file
  const uploadFile = async () => {
    if (!imageUpload) return;
    
    setUploading(true);
    setUploadProgress(0);
    
    try {
      // Create a unique filename using UUID
      const fileName = `${imageUpload.name.split('.')[0]}-${uuidv4()}`;
      const imagePath = `${folderPath}/${fileName}`;
      const imageRef = ref(storage, imagePath);
      
      // Upload the file
      const uploadTask = uploadBytes(imageRef, imageUpload);
      
      // Wait for upload to complete
      const snapshot = await uploadTask;
      setUploadProgress(100);
      
      // Get the download URL
      const url = await getDownloadURL(snapshot.ref);
      
      // Add to our image URLs list
      setImageUrls((prev) => [...prev, url]);
      
      // Clear the selected file and preview
      setImageUpload(null);
      setPreviewUrl(null);
      
      // Call the callback with the URL if provided
      if (onImageUpload) {
        onImageUpload(url, imagePath);
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  // Delete an image
  const deleteImage = async (url, index) => {
    // Implementation for delete functionality would go here
    // This would require extracting the path from the URL and using deleteObject
    try {
      // Note: This is a simplistic approach; in production you'd need to store references
      setImageUrls((prev) => prev.filter((_, i) => i !== index));
    } catch (error) {
      console.error("Error deleting image:", error);
    }
  };

  return (
    <div className="image-uploader">
      <div className="upload-container">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="file-input"
          disabled={uploading}
        />
        
        {previewUrl && (
          <div className="preview-container">
            <img 
              src={previewUrl} 
              alt="Preview" 
              className="preview-image" 
              style={{ maxHeight: '100px' }}
            />
            <button 
              onClick={() => { setImageUpload(null); setPreviewUrl(null); }}
              className="remove-preview"
            >
              Remove
            </button>
          </div>
        )}
        
        <button 
          onClick={uploadFile} 
          disabled={!imageUpload || uploading}
          className="upload-button"
        >
          {uploading ? 'Uploading...' : 'Upload Image'}
        </button>
        
        {uploading && (
          <div className="progress-bar-container">
            <div 
              className="progress-bar" 
              style={{ width: `${uploadProgress}%` }}
            ></div>
            <span>{uploadProgress}%</span>
          </div>
        )}
      </div>
      
      <div className="gallery">
        {imageUrls.map((url, index) => (
          <div key={index} className="image-container">
            <img 
              src={url} 
              alt={`Uploaded ${index}`} 
              className="uploaded-image"
              style={{ maxWidth: '150px', margin: '5px' }}
            />
            <button 
              onClick={() => deleteImage(url, index)}
              className="delete-button"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImageUploader;