import React, { useState, useRef } from 'react';
import { UploadIcon } from './icons/UploadIcon';
import { DocumentIcon } from './icons/DocumentIcon';
import { GoogleDriveIcon } from './icons/GoogleDriveIcon';
import { processTextFile, processImageFile } from '../services/fileParser';
import { Drawing, User } from '../types';
import { UserManagementPanel } from './UserManagementPanel';
import { UserGroupIcon } from './icons/UserGroupIcon';
import { ExportIcon } from './icons/ExportIcon';
import JSZip from 'jszip';


declare global {
  namespace React {
    interface InputHTMLAttributes<T> {
      webkitdirectory?: string;
    }
  }
}

interface AdminPanelProps {
  onKnowledgeBaseUpdate: (data: { text: string; drawings: Drawing[] }) => void;
  users: User[];
  onAddUser: (email: string, password: string) => Promise<string | null>;
  onDeleteUser: (email: string) => Promise<void>;
  knowledgeBaseText: string;
  drawings: Drawing[];
  isKnowledgeBaseLoaded: boolean;
}

type AdminTab = 'knowledge' | 'users';

export const AdminPanel: React.FC<AdminPanelProps> = ({ 
    onKnowledgeBaseUpdate, 
    users, 
    onAddUser, 
    onDeleteUser,
    knowledgeBaseText,
    drawings,
    isKnowledgeBaseLoaded 
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const [activeUploadTab, setActiveUploadTab] = useState('local');
  const [driveMessage, setDriveMessage] = useState('');
  const [activeAdminTab, setActiveAdminTab] = useState<AdminTab>('knowledge');

  const supportedExtensions = ['.xlsx', '.xls', '.pptx', '.docx', '.pdf', '.txt', '.csv', '.md', '.png', '.jpg', '.jpeg', '.svg', '.gif', '.webp'];
  const supportedFileTypesString = supportedExtensions.join(',');

  const handleImportZip = async (zipFile: File) => {
    try {
      const zip = await JSZip.loadAsync(zipFile);
      const manifestFile = zip.file("export-manifest.json");
      if (!manifestFile) {
          setError("Invalid knowledge base zip. 'export-manifest.json' is missing.");
          return;
      }
      const manifest = JSON.parse(await manifestFile.async("string"));

      const textFile = zip.file(manifest.textFile);
      if (!textFile) {
          setError("Invalid knowledge base zip. Text file specified in manifest is missing.");
          return;
      }
      const text = await textFile.async("string");

      const importedDrawings: Drawing[] = [];
      if(manifest.drawingFiles && Array.isArray(manifest.drawingFiles)) {
          for (const drawingName of manifest.drawingFiles) {
              const drawingFile = zip.file(drawingName);
              if (drawingFile) {
                  const blob = await drawingFile.async("blob");
                  const dataUrl = await new Promise<string>((resolve, reject) => {
                      const reader = new FileReader();
                      reader.onloadend = () => resolve(reader.result as string);
                      reader.onerror = reject;
                      reader.readAsDataURL(blob);
                  });
                  importedDrawings.push({ name: drawingName, dataUrl: dataUrl });
              } else {
                  console.warn(`Drawing file '${drawingName}' listed in manifest but not found in zip.`);
              }
          }
      }
      
      onKnowledgeBaseUpdate({ text, drawings: importedDrawings });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      console.error("Error importing ZIP:", err);
      setError(`Failed to import knowledge base. The file may be corrupt or in an invalid format. Error: ${errorMessage}`);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement> | { target: { files: FileList | null } }) => {
    if (event.target.files) {
      const allFiles = Array.from(event.target.files);

      if (allFiles.length === 1 && allFiles[0].name.toLowerCase().endsWith('.zip')) {
          setSelectedFiles([]);
          setError(null);
          handleImportZip(allFiles[0]);
          return;
      }

      const supportedFiles = allFiles.filter((file: File) => 
          supportedExtensions.some(ext => file.name.toLowerCase().endsWith(ext))
      );
      
      if (supportedFiles.length === 0 && allFiles.length > 0) {
          setError(`The selected folder or files do not contain any supported types (${supportedExtensions.join(', ')}).`);
          setSelectedFiles([]);
      } else if (supportedFiles.length > 0) {
          setSelectedFiles(supportedFiles);
          setError(null); 
      }
    }
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleFolderClick = () => {
    folderInputRef.current?.click();
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange({ target: { files: e.dataTransfer.files }});
      e.dataTransfer.clearData();
    }
  };

  const handleLoadData = async () => {
    if (selectedFiles.length === 0) return;
    setError(null);

    const textAndDocExtensions = ['.xlsx', '.xls', '.pptx', '.docx', '.pdf', '.txt', '.csv', '.md'];
    const imageExtensions = ['.png', '.jpg', '.jpeg', '.svg', '.gif', '.webp'];

    const textFiles = selectedFiles.filter(file => textAndDocExtensions.some(ext => file.name.toLowerCase().endsWith(ext)));
    const imageFiles = selectedFiles.filter(file => imageExtensions.some(ext => file.name.toLowerCase().endsWith(ext)));
    
    const textProcessingPromises = textFiles.map(processTextFile);
    const imageProcessingPromises = imageFiles.map(processImageFile);
    
    const textResults = await Promise.allSettled(textProcessingPromises);
    const imageResults = await Promise.allSettled(imageProcessingPromises);

    let combinedData = '';
    const loadedDrawings: Drawing[] = [];
    const errorMessages: string[] = [];
    let successfulUploads = 0;

    textResults.forEach((result, index) => {
        const file = textFiles[index];
        if (result.status === 'fulfilled' && file) {
            combinedData += result.value + `\n\n--- End of File: ${file.name} ---\n\n`;
            successfulUploads++;
        } else if (result.status === 'rejected') {
            errorMessages.push(result.reason as string);
        }
    });

    imageResults.forEach((result) => {
        if (result.status === 'fulfilled') {
            loadedDrawings.push(result.value);
            successfulUploads++;
        } else if (result.status === 'rejected') {
            errorMessages.push(result.reason as string);
        }
    });

    if (errorMessages.length > 0) {
        setError(errorMessages.join('\n'));
    }

    if(successfulUploads > 0) {
        onKnowledgeBaseUpdate({ text: combinedData, drawings: loadedDrawings });
    }
  };

  const handleExport = async () => {
    try {
        const zip = new JSZip();
        
        zip.file("knowledge_base.txt", knowledgeBaseText);

        const manifest = {
            textFile: "knowledge_base.txt",
            drawingFiles: drawings.map(d => d.name)
        };
        zip.file("export-manifest.json", JSON.stringify(manifest, null, 2));

        for (const drawing of drawings) {
            const response = await fetch(drawing.dataUrl);
            const blob = await response.blob();
            zip.file(drawing.name, blob);
        }

        const content = await zip.generateAsync({ type: "blob" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(content);
        link.download = "knowledge-base.zip";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        console.error("Error exporting knowledge base:", err);
        setError(`Failed to export knowledge base. Error: ${errorMessage}`);
    }
  };
  
  const renderKnowledgeBasePanel = () => (
    <div>
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 text-blue-800 text-sm rounded-md" role="alert">
          Your loaded knowledge base is stored in your browser. Use 'Export' to save it for sharing, or 'Reset' in the header to clear it.
      </div>
      <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-6" aria-label="Tabs">
              <button
                  onClick={() => { setActiveUploadTab('local'); setDriveMessage(''); }}
                  className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors focus:outline-none ${activeUploadTab === 'local' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              >
                  From Device
              </button>
              <button
                  onClick={() => { setActiveUploadTab('drive'); setError(null); }}
                  className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors focus:outline-none ${activeUploadTab === 'drive' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              >
                  From Google Drive
              </button>
          </nav>
      </div>
      <div className="mt-4">
          {activeUploadTab === 'local' && (
              <div>
                  <p className="text-sm text-gray-600 mb-2">
                    Upload files, a folder, or import a previously exported <code>knowledge-base.zip</code>.
                  </p>
                  <div 
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`w-full p-6 rounded-md flex flex-col items-center justify-center text-gray-500 transition border-2 border-dashed ${isDragging ? 'border-brand-primary' : (error ? 'border-red-500' : 'border-gray-300')}`}
                  >
                      <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden"
                      accept={`${supportedFileTypesString},.zip`}
                      multiple
                      />
                      <input
                      type="file"
                      ref={folderInputRef}
                      onChange={handleFileChange}
                      className="hidden"
                      webkitdirectory=""
                      multiple
                      />
                      {selectedFiles.length > 0 && !error ? (
                      <div className="text-center p-2 w-full">
                          <DocumentIcon className="h-8 w-8 mx-auto text-brand-primary" />
                          <ul className="mt-2 text-sm text-left max-h-24 overflow-y-auto">
                              {selectedFiles.map(file => (
                                  <li key={file.name} className="truncate" title={file.name}>
                                      - {file.name} ({(file.size / 1024).toFixed(2)} KB)
                                  </li>
                              ))}
                          </ul>
                      </div>
                      ) : (
                      <div className="text-center flex flex-col justify-center items-center pointer-events-none">
                          <UploadIcon className="h-10 w-10 mx-auto text-gray-400" />
                          <p className="mt-3 text-base text-gray-600">Drag & drop files, a folder, or a <code>.zip</code> here</p>
                          <p className="my-2 text-sm text-gray-400">or</p>
                          <div className="flex items-center space-x-4 pointer-events-auto">
                              <button
                                  onClick={handleFileClick}
                                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-semibold rounded-md hover:bg-gray-50 transition-colors"
                              >
                                  Select Files
                              </button>
                              <button
                                  onClick={handleFolderClick}
                                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-semibold rounded-md hover:bg-gray-50 transition-colors"
                              >
                                  Select Folder
                              </button>
                          </div>
                      </div>
                      )}
                  </div>
                  {error && <pre className="text-red-600 text-sm mt-2 whitespace-pre-wrap font-sans">{error}</pre>}
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <button
                          onClick={handleLoadData}
                          disabled={selectedFiles.length === 0}
                          className="w-full flex items-center justify-center bg-brand-primary text-white font-bold py-2 px-4 rounded-md hover:bg-blue-800 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                          Load from Files
                      </button>
                      <button
                          onClick={handleExport}
                          disabled={!isKnowledgeBaseLoaded}
                          className="w-full flex items-center justify-center bg-gray-600 text-white font-bold py-2 px-4 rounded-md hover:bg-gray-700 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                          <ExportIcon className="h-5 w-5 mr-2" />
                          Export Knowledge Base
                      </button>
                  </div>
              </div>
          )}
          {activeUploadTab === 'drive' && (
              <div className="text-center py-8 px-4 flex flex-col items-center justify-center bg-gray-50 rounded-md">
                  <GoogleDriveIcon className="h-16 w-16 mx-auto" />
                  <h3 className="mt-4 text-lg font-semibold text-gray-800">Connect to Google Drive</h3>
                  <p className="mt-2 max-w-sm mx-auto text-sm text-gray-600">
                  Import files directly from your Google Drive account to build the knowledge base.
                  </p>
                  <div className="mt-6">
                      <button
                          onClick={() => setDriveMessage('This is a demonstration. A full Google Drive integration requires API credentials and a secure OAuth setup, which is not configured in this environment.')}
                          className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 font-semibold rounded-md hover:bg-gray-50 transition-colors"
                      >
                          <GoogleDriveIcon className="h-5 w-5" />
                          <span>Connect to Google Drive</span>
                      </button>
                  </div>
                  {driveMessage && (
                      <div className="mt-4 text-sm text-center text-blue-800 bg-blue-100 p-3 rounded-md max-w-md mx-auto animate-fade-in-up">
                          <p className="font-semibold">Feature Demo</p>
                          <p>{driveMessage}</p>
                      </div>
                  )}
              </div>
          )}
      </div>
    </div>
  );

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 animate-fade-in-up w-full">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              <button
                  onClick={() => setActiveAdminTab('knowledge')}
                  className={`flex items-center space-x-2 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm focus:outline-none ${activeAdminTab === 'knowledge' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              >
                  <UploadIcon className="h-5 w-5"/>
                  <span>Manage Knowledge Base</span>
              </button>
              <button
                  onClick={() => setActiveAdminTab('users')}
                  className={`flex items-center space-x-2 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm focus:outline-none ${activeAdminTab === 'users' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              >
                  <UserGroupIcon className="h-5 w-5"/>
                  <span>Manage Users</span>
              </button>
          </nav>
        </div>
        <div className="mt-6">
            {activeAdminTab === 'knowledge' && renderKnowledgeBasePanel()}
            {activeAdminTab === 'users' && <UserManagementPanel users={users} onAddUser={onAddUser} onDeleteUser={onDeleteUser} />}
        </div>
    </div>
  );
};
