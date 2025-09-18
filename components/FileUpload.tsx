import React, { useCallback } from 'react';

interface FileUploadProps {
  files: File[];
  onFileChange: (files: File[]) => void;
  onAnalyze: () => void;
  isLoading: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ files, onFileChange, onAnalyze, isLoading }) => {
  
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      onFileChange(Array.from(selectedFiles));
    } else {
      onFileChange([]);
    }
    // Reset the input value to allow re-selecting the same file(s)
    event.target.value = '';
  };
  
  const handleDragOver = useCallback((event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
  }, []);

  const handleDrop = useCallback((event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    const droppedFiles = event.dataTransfer.files;
    if (droppedFiles && droppedFiles.length > 0) {
      onFileChange(Array.from(droppedFiles));
    }
  }, [onFileChange]);


  return (
    <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-slate-200">
      <div className="flex flex-col items-center space-y-6">
        <label
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          htmlFor="file-upload"
          className="relative cursor-pointer w-full flex flex-col items-center justify-center p-10 border-2 border-dashed border-slate-300 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
        >
          <div className="text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="mt-2 text-sm text-slate-600">
              <span className="font-semibold text-sky-600">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-slate-500">Upload one or more monthly reports (PDF, CSV, TXT)</p>
          </div>
          <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileSelect} accept=".csv,.txt,.pdf,text/plain,text/csv,application/pdf" multiple />
        </label>
        
        {files.length > 0 && (
          <div className="w-full text-left p-4 bg-green-50 border border-green-200 rounded-md max-h-40 overflow-y-auto">
            <p className="text-sm font-medium text-green-800 mb-2">
              {files.length} file(s) selected:
            </p>
            <ul className="space-y-1">
              {files.map((f) => (
                <li key={f.name} className="text-xs text-green-700 truncate">
                  {f.name}
                </li>
              ))}
            </ul>
          </div>
        )}

        <button
          onClick={onAnalyze}
          disabled={files.length === 0 || isLoading}
          className="w-full sm:w-auto px-12 py-3 text-base font-semibold text-white bg-sky-500 rounded-lg shadow-md hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 focus:ring-offset-slate-50 disabled:bg-slate-400 disabled:cursor-not-allowed transition-all duration-200 ease-in-out transform hover:scale-105"
        >
          {isLoading ? 'Analyzing...' : 'Analyze Performance'}
        </button>
      </div>
    </div>
  );
};

export default FileUpload;