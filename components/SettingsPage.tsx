import React, { useState, useEffect, useCallback } from 'react';
import FileUpload from './FileUpload';
import { StoredFile, getAllFiles, addFile, deleteFile } from '../utils/db';

interface ActiveFile {
  name: string;
  content: string;
}

interface SettingsPageProps {
  onProceed: () => void;
  onBack: () => void;
  languageOptions: { [key: string]: string };
  currentLanguage: string;
  onLanguageChange: (lang: string) => void;
  activeFile: ActiveFile | null;
  onFileLoad: (file: ActiveFile) => void;
  onFileClear: () => void;
  onError: (message: string) => void;
}

// Helper function to format file sizes
const formatBytes = (bytes: number, decimals = 2): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}


const SettingsPage: React.FC<SettingsPageProps> = ({
  onProceed,
  onBack,
  languageOptions,
  currentLanguage,
  onLanguageChange,
  activeFile,
  onFileLoad,
  onFileClear,
  onError,
}) => {
    const [library, setLibrary] = useState<StoredFile[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const refreshLibrary = useCallback(async () => {
        setIsLoading(true);
        try {
            const files = await getAllFiles();
            setLibrary(files);
        } catch (err) {
            onError(err instanceof Error ? err.message : 'Could not load knowledge base library.');
        } finally {
            setIsLoading(false);
        }
    }, [onError]);

    useEffect(() => {
        refreshLibrary();
    }, [refreshLibrary]);

    const handleFileStore = useCallback(async (fileToStore: StoredFile) => {
        try {
            await addFile(fileToStore);
            await refreshLibrary();
        } catch (err) {
            onError(err instanceof Error ? err.message : 'Could not save file to the library.');
        }
    }, [onError, refreshLibrary]);

    const handleDelete = useCallback(async (fileName: string) => {
        if (window.confirm(`Are you sure you want to permanently delete "${fileName}"?`)) {
            try {
                await deleteFile(fileName);
                if (activeFile?.name === fileName) {
                    onFileClear();
                }
                await refreshLibrary();
            } catch (err) {
                onError(err instanceof Error ? err.message : `Could not delete file: ${fileName}.`);
            }
        }
    }, [activeFile, onFileClear, onError, refreshLibrary]);

    const handleLoad = (file: StoredFile) => {
        onFileLoad({name: file.name, content: file.content});
    }

  return (
    <div className="h-screen w-screen bg-white flex items-center justify-center font-sans text-gray-900 p-4">
      <div className="max-w-3xl w-full bg-gray-50 border-gray-200 border rounded-lg p-8 shadow-2xl flex flex-col gap-8">
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
             <div className="flex justify-between items-center mb-4">
                <div>
                    <h2 className="text-lg font-semibold text-gray-800">Knowledge Base Library</h2>
                    <p className="text-sm text-gray-600">Upload files/folders to your permanent library. Then, load one to use it in your chat session.</p>
                </div>
                <FileUpload onFileStored={handleFileStore} onError={onError} />
             </div>

             <div className="bg-white border border-gray-200 rounded-lg max-h-60 overflow-y-auto">
                <table className="w-full text-sm text-left text-gray-600">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-100 sticky top-0">
                        <tr>
                            <th scope="col" className="px-4 py-2 w-1/2">File Name</th>
                            <th scope="col" className="px-4 py-2">Size</th>
                            <th scope="col" className="px-4 py-2">Last Modified</th>
                            <th scope="col" className="px-4 py-2 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan={4} className="text-center p-4">Loading Library...</td></tr>
                        ) : library.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="text-center p-8">
                                    <h3 className="font-semibold text-gray-700">Your library is empty.</h3>
                                    <p className="text-gray-500 mt-1">Upload files or a folder to build your knowledge base.</p>
                                </td>
                            </tr>
                        ) : (
                           library.map((file) => (
                                <tr key={file.name} className={`border-b border-gray-200 ${activeFile?.name === file.name ? 'bg-green-50' : 'hover:bg-gray-50'}`}>
                                    <td className="px-4 py-2 font-medium text-gray-900 truncate max-w-xs" title={file.name}>{file.name}</td>
                                    <td className="px-4 py-2">{formatBytes(file.size)}</td>
                                    <td className="px-4 py-2">{new Date(file.lastModified).toLocaleDateString()}</td>
                                    <td className="px-4 py-2 text-right space-x-2">
                                        {activeFile?.name === file.name ? (
                                            <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-200 rounded-full">Loaded</span>
                                        ) : (
                                            <button onClick={() => handleLoad(file)} className="font-medium text-green-600 hover:underline">Load</button>
                                        )}
                                        <button onClick={() => handleDelete(file.name)} className="font-medium text-red-600 hover:underline">Delete</button>
                                    </td>
                                </tr>
                           ))
                        )}
                    </tbody>
                </table>
             </div>
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