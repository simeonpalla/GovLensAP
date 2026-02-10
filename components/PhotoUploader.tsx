
import React, { useState } from 'react';

interface PhotoUploaderProps {
  onPhotoCaptured: (base64: string) => void;
  isProcessing: boolean;
}

const PhotoUploader: React.FC<PhotoUploaderProps> = ({ onPhotoCaptured, isProcessing }) => {
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setPreview(base64);
        onPhotoCaptured(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="mb-6">
      <label className="block text-sm font-semibold text-[#2C3E50] mb-2">Upload Photo of the Issue</label>
      <div className="relative group cursor-pointer border-2 border-dashed border-[#8FA9C0] rounded-xl overflow-hidden hover:border-[#5B7C99] transition bg-[#F8F9FA] h-48 sm:h-64 flex flex-col items-center justify-center">
        {preview ? (
          <img src={preview} alt="Issue preview" className="w-full h-full object-cover" />
        ) : (
          <div className="text-center p-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-[#8FA9C0]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="mt-2 text-sm text-[#5B7C99]">Drag and drop or click to upload photo</p>
          </div>
        )}
        <input 
          type="file" 
          accept="image/*" 
          capture="environment"
          onChange={handleFileChange}
          disabled={isProcessing}
          className="absolute inset-0 opacity-0 cursor-pointer" 
        />
        {preview && !isProcessing && (
          <div className="absolute top-2 right-2 bg-white/80 p-1 rounded-full text-gray-500 hover:text-red-500 shadow-sm" onClick={(e) => { e.stopPropagation(); setPreview(null); }}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
};

export default PhotoUploader;
