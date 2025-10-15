
import React, { useState, useCallback } from 'react';
import { parseFile } from '../utils/fileParser';

interface FileUploadProps {
  onFileProcessed: (fileName: string, content: string) => void;
  onFileCleared: () => void;
  onError: (message: string) => void;
  disabled: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileProcessed, onFileCleared, onError, disabled }) => {
  const [selectionName, setSelectionName] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    setIsProcessing(true);
    
    // Folder Upload logic
    const isFolder = files.length > 1 || (files[0] && files[0].webkitRelativePath);
    if (isFolder) {
        const folderName = files[0].webkitRelativePath.split('/')[0];
        setSelectionName(folderName);
        let combinedContent = '';
        try {
            for (const file of Array.from(files)) {
                try {
                    const content = await parseFile(file);
                    combinedContent += `\n\n--- Content from ${file.name} ---\n${content}`;
                } catch (err) {
                    // FIX: Made error handling type-safe. The 'err' object is of type 'unknown', so we check if it's an Error instance before accessing properties.
                    const message = err instanceof Error ? err.message : String(err);
                    console.warn(`Skipping file ${file.name}: ${message}`);
                }
            }
            if (!combinedContent) {
                throw new Error("No readable files found in the selected folder.");
            }
            onFileProcessed(folderName, combinedContent.trim());
        } catch (err) {
            // FIX: Made error handling type-safe. The 'err' object is of type 'unknown', so we check if it's an Error instance before accessing properties.
            const message = err instanceof Error ? err.message : "Could not read the selected folder.";
            onError(message);
            setSelectionName(null);
        }
    } else { // Single file upload
        const file = files[0];
        setSelectionName(file.name);
        try {
            const content = await parseFile(file);
            onFileProcessed(file.name, content);
        } catch (err) {
            // FIX: Made error handling type-safe. The 'err' object is of type 'unknown', so we check if it's an Error instance before accessing properties.
            const message = err instanceof Error ? err.message : "Could not read the selected file.";
            onError(message);
            setSelectionName(null);
        }
    }

    setIsProcessing(false);
    // Reset file input value to allow re-uploading the same file/folder
    event.target.value = '';
  }, [onFileProcessed, onError]);
  
  const handleClearFile = useCallback(() => {
    setSelectionName(null);
    onFileCleared();
  }, [onFileCleared]);

  const processingText = isProcessing ? 'Processing...' : null;

  return (
    <div className="flex items-center gap-2">
      {!selectionName && (
        <div className="flex items-center gap-2">
             <label htmlFor="file-upload" className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${disabled || isProcessing ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700 cursor-pointer'}`}>
                {processingText || 'Upload File'}
             </label>
             <input id="file-upload" type="file" className="hidden" onChange={handleFileChange} disabled={disabled || isProcessing}/>

             <label htmlFor="folder-upload" className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${disabled || isProcessing ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700 cursor-pointer'}`}>
                {processingText || 'Upload Folder'}
             </label>
             {/* Use spread attributes for non-standard properties to avoid module augmentation issues. */}
             <input id="folder-upload" type="file" className="hidden" onChange={handleFileChange} {...{webkitdirectory: ""}} disabled={disabled || isProcessing}/>
        </div>
      )}
      
      {selectionName && (
          <div className="flex items-center gap-2 text-sm text-gray-300">
              <span className="max-w-[150px] truncate" title={selectionName}>{selectionName}</span>
              <button 
                  onClick={handleClearFile} 
                  className="p-1 rounded-full hover:bg-gray-700 disabled:opacity-50"
                  disabled={disabled || isProcessing}
                  title="Clear selection"
              >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
              </button>
          </div>
      )}
    </div>
  );
};

export default FileUpload;