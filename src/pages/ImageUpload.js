import { useState, useRef } from 'react';
import { Upload } from 'lucide-react';

const ImageUpload = ({ onImageSelect }) => {
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result);
      // Pass the base64 string to parent component
      onImageSelect(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = (e) => {
    e.stopPropagation();
    setPreview(null);
    onImageSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="mb-4">
      <div 
        className="border-2 border-dashed border-gray-600 rounded-lg p-4 text-center cursor-pointer hover:border-gray-500"
        onClick={() => fileInputRef.current?.click()}
      >
        {preview ? (
          <div className="relative">
            <img 
              src={preview} 
              alt="Character preview" 
              className="max-h-48 mx-auto rounded"
            />
            <button 
              className="absolute top-2 right-2 bg-gray-800 p-1 rounded-full text-white hover:bg-gray-700"
              onClick={handleRemoveImage}
            >
              <span className="sr-only">Remove image</span>
              ×
            </button>
          </div>
        ) : (
          <div className="text-gray-500">
            <Upload className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm">Click to upload character image</p>
            <p className="text-xs text-gray-400">PNG, JPG up to 5MB</p>
          </div>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="image/*"
        onChange={handleFileSelect}
      />
    </div>
  );
};

export default ImageUpload;