import React from 'react';
import FileUpload from './FileUpload';

interface SettingsPageProps {
  onProceed: () => void;
  onBack: () => void;
  languageOptions: { [key: string]: string };
  currentLanguage: string;
  onLanguageChange: (lang: string) => void;
  currentFileName: string | null;
  onFileProcessed: (fileName: string, content: string) => void;
  onFileCleared: () => void;
  onError: (message: string) => void;
  isLoading: boolean;
}

const SettingsPage: React.FC<SettingsPageProps> = ({
  onProceed,
  onBack,
  languageOptions,
  currentLanguage,
  onLanguageChange,
  currentFileName,
  onFileProcessed,
  onFileCleared,
  onError,
  isLoading,
}) => {
  return (
    <div className="h-screen w-screen bg-white flex items-center justify-center font-sans text-gray-900 p-4">
      <div className="max-w-2xl w-full bg-gray-50 border-gray-200 border rounded-lg p-8 shadow-2xl flex flex-col gap-8">
        <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Session Setup</h1>
            <p className="text-gray-600">Configure your session before starting the chat.</p>
        </div>
        
        {/* --- Language Section --- */}
        <div className="border-t border-gray-200 pt-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Language</h2>
            <div className="relative max-w-xs">
                <select
                    value={currentLanguage}
                    onChange={(e) => onLanguageChange(e.target.value)}
                    className="w-full border rounded-md py-2 pl-3 pr-8 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none appearance-none bg-white border-gray-300 text-gray-800"
                    aria-label="Select language"
                >
                    {Object.entries(languageOptions).map(([code, name]) => (
                        <option key={code} value={code}>{name}</option>
                    ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
            </div>
        </div>

        {/* --- Knowledge Base Section --- */}
        <div className="border-t border-gray-200 pt-6">
             <h2 className="text-lg font-semibold text-gray-800 mb-3">Add Knowledge Base</h2>
             <p className="text-sm text-gray-600 mb-4">Use the "Upload File" or "Upload Folder" option to provide context from your technical documents.</p>
             <FileUpload 
                onFileProcessed={onFileProcessed} 
                onFileCleared={onFileCleared}
                onError={onError}
                disabled={isLoading} 
             />
             <p className="text-xs text-gray-500 mt-2">
                Supported formats: .pdf, .docx, .xlsx, .pptx, .txt, and .zip archives. Note: .rar and .7z are not supported.
             </p>
        </div>
        
        <div className="border-t border-gray-200 pt-6 flex justify-between items-center">
            <button
                onClick={onBack}
                className="bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-md hover:bg-gray-300 transition-all"
            >
              &larr; Back
            </button>
            <button
              onClick={onProceed}
              className="bg-green-600 text-white font-semibold py-3 px-8 rounded-md hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all text-lg transform hover:scale-105"
            >
              Start Chat &rarr;
            </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;