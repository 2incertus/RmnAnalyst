import React, { useState, useCallback } from 'react';
import type { AnalysisResult } from './types';
import { PageState } from './types';
import FileUpload from './components/FileUpload';
import AnalysisDisplay from './components/AnalysisDisplay';
import LoadingSpinner from './components/LoadingSpinner';
import * as pdfjsLib from 'pdfjs-dist';

// Required for pdf.js to work
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://aistudiocdn.com/pdfjs-dist@^4.5.136/build/pdf.worker.mjs`;

const App: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [pageState, setPageState] = useState<PageState>(PageState.INITIAL);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (selectedFiles: File[]) => {
    setFiles(selectedFiles);
    setAnalysis(null);
    setError(null);
    setPageState(PageState.INITIAL);
  };

  const readFileContent = async (file: File): Promise<string> => {
    try {
      if (file.type === 'application/pdf') {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
        let textContent = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const text = await page.getTextContent();
          textContent += text.items.map(item => 'str' in item ? item.str : '').join(' ') + '\n';
        }
        return textContent;
      }
      return await file.text();
    } catch (error) {
      console.error(`Failed to read file ${file.name}:`, error);
      // Return an empty string or some indicator of failure
      return "";
    }
  };


  const handleAnalyze = useCallback(async () => {
    if (files.length === 0) {
      setError("Please select one or more report files first.");
      setPageState(PageState.ERROR);
      return;
    }

    setPageState(PageState.ANALYZING);
    setError(null);
    setAnalysis(null);

    try {
      console.log("Starting analysis...");
      const fileContents = await Promise.all(files.map(readFileContent));
      console.log("File contents read, sending to API...");
      
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileContents }),
      });
      console.log("API response received:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API error response:", errorText);
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
      }

      const result = await response.json();
      console.log("Analysis successful, setting results.");
      setAnalysis(result);
      setPageState(PageState.RESULTS);
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred during analysis.";
      setError(`Analysis failed. ${errorMessage}. Please check the file format or try again.`);
      setPageState(PageState.ERROR);
    }
  }, [files]);

  const handleReset = () => {
    setFiles([]);
    setAnalysis(null);
    setError(null);
    setPageState(PageState.INITIAL);
  };

  const getReportName = () => {
    if (files.length === 0) return 'your data';
    if (files.length === 1) return files[0].name;
    return `${files.length} reports`;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8 text-sky-500">
                <path d="M12.378 1.602a.75.75 0 00-.756 0L3.32 6.096A.75.75 0 003 6.787v10.426c0 .339.224.636.55.733l8.25 2.475a.75.75 0 00.4 0l8.25-2.475a.75.75 0 00.55-.733V6.787a.75.75 0 00-.32-.691L12.378 1.602zM12 16.5a4.5 4.5 0 100-9 4.5 4.5 0 000 9z" />
                <path d="M11.645 5.222a.75.75 0 01.71 0l8.25 4.125a.75.75 0 010 1.306l-8.25 4.125a.75.75 0 01-.71 0L3.395 10.653a.75.75 0 010-1.306l8.25-4.125zM4.5 14.143L12 17.7l7.5-3.557V18.3a.75.75 0 01-.55.733l-8.25 2.475a.75.75 0 01-.4 0L3.55 19.033A.75.75 0 013 18.3v-4.157c0 .22.108.423.284.558l1.216.942z" />
            </svg>
            <h1 className="text-2xl font-bold text-slate-800">Petco RMN Performance Analyst</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">Unlock Insights from Your Petco Media Data</h2>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-slate-600">
              Upload monthly performance reports to get AI-powered recommendations and contextual analysis for your Petco Retail Media Network campaigns.
            </p>
          </div>

          {pageState !== PageState.RESULTS && (
            <FileUpload
              files={files}
              onFileChange={handleFileChange}
              onAnalyze={handleAnalyze}
              isLoading={pageState === PageState.ANALYZING}
            />
          )}

          {pageState === PageState.ANALYZING && (
            <div className="mt-8 text-center">
              <LoadingSpinner />
              <p className="text-lg text-slate-600 animate-pulse mt-4">Analyzing your reports... this may take a moment.</p>
            </div>
          )}

          {pageState === PageState.ERROR && (
            <div className="mt-8 p-4 bg-red-100 border border-red-300 text-red-800 rounded-lg">
              <p className="font-bold">Error</p>
              <p>{error}</p>
            </div>
          )}
          
          {pageState === PageState.RESULTS && analysis && (
            <AnalysisDisplay analysis={analysis} onReset={handleReset} reportName={getReportName()}/>
          )}
        </div>
      </main>
      
      <footer className="text-center py-6 text-slate-500 text-sm">
        <p>&copy; {new Date().getFullYear()} AI RMN Analyst. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default App;