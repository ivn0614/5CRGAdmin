import { 
    ref, 
    uploadBytes, 
    getDownloadURL, 
    deleteObject, 
    listAll 
  } from "firebase/storage";
  import { storage } from "./Firebase";
  import { v4 as uuidv4 } from "uuid";
  
  /**
   * Upload a file to Firebase Storage
   * @param {File} file - The file to upload
   * @param {string} path - The storage path (without filename)
   * @param {function} progressCallback - Optional callback to report upload progress
   * @param {boolean} useUniqueFilename - Whether to generate a unique filename
   * @returns {Promise<{url: string, path: string, name: string}>}
   */
  export const uploadFile = async (
    file, 
    path, 
    progressCallback = null,
    useUniqueFilename = true
  ) => {
    if (!file) throw new Error("No file provided");
    
    try {
      // Generate filename
      let fileName = file.name;
      if (useUniqueFilename) {
        const nameParts = file.name.split('.');
        const extension = nameParts.length > 1 ? `.${nameParts.pop()}` : '';
        fileName = `${nameParts.join('.')}-${uuidv4()}${extension}`;
      }
      
      // Set up the storage reference
      const fullPath = `${path}/${fileName}`;
      const fileRef = ref(storage, fullPath);
      
      // Upload the file
      if (progressCallback) progressCallback(10);
      await uploadBytes(fileRef, file);
      if (progressCallback) progressCallback(75);
      
      // Get the download URL
      const downloadURL = await getDownloadURL(fileRef);
      if (progressCallback) progressCallback(100);
      
      return {
        url: downloadURL,
        path: fullPath,
        name: fileName
      };
    } catch (error) {
      console.error("Upload error:", error);
      throw error;
    }
  };
  
  /**
   * Delete a file from Firebase Storage
   * @param {string} path - The full path to the file
   * @returns {Promise<void>}
   */
  export const deleteFile = async (path) => {
    try {
      const fileRef = ref(storage, path);
      await deleteObject(fileRef);
      return true;
    } catch (error) {
      console.error("Delete error:", error);
      throw error;
    }
  };
  
  /**
   * List files in a directory
   * @param {string} path - The directory path
   * @returns {Promise<Array<{url: string, path: string, name: string}>>}
   */
  export const listFiles = async (path) => {
    try {
      const dirRef = ref(storage, path);
      const result = await listAll(dirRef);
      
      const files = await Promise.all(
        result.items.map(async (item) => {
          const url = await getDownloadURL(item);
          return {
            url,
            path: item.fullPath,
            name: item.name
          };
        })
      );
      
      return files;
    } catch (error) {
      console.error("List files error:", error);
      throw error;
    }
  };
  
  /**
   * Extract file path from Firebase Storage URL
   * @param {string} url - The Firebase Storage download URL
   * @returns {string|null} - The file path or null if parsing fails
   */
  export const getPathFromUrl = (url) => {
    try {
      // Example URL format: https://firebasestorage.googleapis.com/v0/b/YOUR_BUCKET/o/PATH?token=TOKEN
      const urlObj = new URL(url);
      const pathEncoded = urlObj.pathname.split('/o/')[1];
      if (!pathEncoded) return null;
      
      return decodeURIComponent(pathEncoded);
    } catch (error) {
      console.error("Failed to parse URL:", error);
      return null;
    }
  };