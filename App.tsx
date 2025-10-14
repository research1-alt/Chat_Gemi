import React, { useState, useCallback, useEffect } from 'react';
import { AdminPanel } from './components/AdminPanel';
import { ChatInterface } from './components/ChatInterface';
import { Header } from './components/Header';
import { Message, Drawing } from './types';
import { getSolution } from './services/geminiService';
import * as db from './services/db';
import { preloadedKnowledgeBase } from './services/preloadedData';
import { SpinnerIcon } from './components/icons/SpinnerIcon';
import { LandingPage } from './components/LandingPage';
import { WrenchScrewdriverIcon } from './components/icons/WrenchScrewdriverIcon';

type AppStatus = 'loading' | 'ready';

export default function App() {
  // App State
  const [appStatus, setAppStatus] = useState<AppStatus>('loading');
  const [showLandingPage, setShowLandingPage] = useState<boolean>(true);
  
  // Knowledge Base State
  const [knowledgeBaseText, setKnowledgeBaseText] = useState<string>('');
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  
  // Chat State
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [language, setLanguage] = useState<string>('en');

  // UI State
  const [view, setView] = useState<'chat' | 'admin'>('chat');
  const [adminPanelKey, setAdminPanelKey] = useState(Date.now());

  const isKnowledgeBaseLoaded = knowledgeBaseText.trim().length > 0 || drawings.length > 0;

  // --- Effects ---

  const initializeApp = useCallback(async () => {
      try {
        // API Key is now handled via environment variables.

        // 1. Load Knowledge Base
        const kbData = await db.loadKnowledgeBase();
        if (kbData && (kbData.text || kbData.drawings.length > 0)) {
            setKnowledgeBaseText(kbData.text);
            setDrawings(kbData.drawings);
        } else if (preloadedKnowledgeBase) {
            setKnowledgeBaseText(preloadedKnowledgeBase.text);
            setDrawings(preloadedKnowledgeBase.drawings);
            await db.saveKnowledgeBase(preloadedKnowledgeBase.text, preloadedKnowledgeBase.drawings);
        }
        
        // 2. App is ready
        setAppStatus('ready');
      } catch (error) {
        console.error("Initialization error:", error);
        setAppStatus('ready'); // Fallback to ready state on error
      }
    }, []);


  useEffect(() => {
    if (appStatus === 'loading' && !showLandingPage) {
        initializeApp();
    }
  }, [appStatus, showLandingPage, initializeApp]);

  useEffect(() => {
    if (isKnowledgeBaseLoaded && appStatus === 'ready') {
      const welcomeMessage: Message = {
          id: Date.now(),
          sender: 'bot',
          text: 'Knowledge Base Loaded!',
          botResponse: {
              solutionTitle: 'Knowledge Base Loaded Successfully!',
              steps: [{description: 'I am ready to assist. Please ask a question about an error code, symptom, or procedure.', isSafetyWarning: false}],
              clarifyingQuestion: null,
              noSolutionFound: false,
              suggestedQueries: [],
              drawingFileName: null,
          }
      };
      setMessages([welcomeMessage]);
    } else {
        setMessages([]);
    }
  }, [isKnowledgeBaseLoaded, appStatus]);


  // --- App Handlers ---
  
  const handleSendMessage = useCallback(async (text: string) => {
    if (!text.trim() || !isKnowledgeBaseLoaded) return;

    const userMessage: Message = { id: Date.now(), sender: 'user', text };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const drawingFileNames = drawings.map(d => d.name);
      const botResponseData = await getSolution(knowledgeBaseText, text, language, drawingFileNames);
      const botMessage: Message = {
        id: Date.now() + 1,
        sender: 'bot',
        text: 'Here is the information I found:',
        botResponse: botResponseData,
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error("Error getting solution from Gemini:", error);
      const errorMessage: Message = {
        id: Date.now() + 1,
        sender: 'bot',
        text: "Sorry, I encountered an error.",
        botResponse: {
            solutionTitle: 'API Error',
            steps: [],
            clarifyingQuestion: null,
            suggestedQueries: [],
            noSolutionFound: true,
            drawingFileName: null,
            error: error instanceof Error ? error.message : "An unknown error occurred. Please check the console.",
        }
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [knowledgeBaseText, drawings, isKnowledgeBaseLoaded, language]);

  const handleKnowledgeBaseUpdate = async (data: { text: string; drawings: Drawing[] }) => {
    setKnowledgeBaseText(data.text);
    setDrawings(data.drawings);
    try {
      await db.saveKnowledgeBase(data.text, data.drawings);
      setView('chat');
    } catch (error) {
      console.error("Failed to save knowledge base:", error);
    }
  };
  
  const handleReset = useCallback(async () => {
    if(window.confirm("Are you sure you want to reset the knowledge base? This action cannot be undone.")){
        setKnowledgeBaseText('');
        setDrawings([]);
        setAdminPanelKey(Date.now());
        try {
          await db.clearKnowledgeBase();
        } catch (error) {
          console.error("Failed to clear knowledge base:", error);
        }
    }
  }, []);

  const handleViewToggle = () => {
      setView(prev => prev === 'chat' ? 'admin' : 'chat');
  };

  // --- Render Logic ---

  if (showLandingPage) {
    return <LandingPage onStart={() => {
        setShowLandingPage(false);
        setAppStatus('loading');
    }} />;
  }
  
  const renderAppStatus = () => {
      switch(appStatus) {
        case 'loading':
            return (
                <div className="flex items-center justify-center h-screen">
                    <div className="text-center flex flex-col items-center space-y-3 text-gray-600">
                        <SpinnerIcon className="h-10 w-10 animate-spin text-brand-primary" />
                        <p className="text-lg">Initializing Application...</p>
                    </div>
                </div>
            );
        case 'ready':
            return renderReadyState();
        default:
            return <div className="text-red-500 text-center p-8">Invalid application state.</div>;
      }
  };

  const renderReadyState = () => {
    const renderContent = () => {
      if (view === 'admin') {
        return (
          <div className="flex-grow flex items-start justify-center pt-6">
              <div className="w-full max-w-4xl">
                  <AdminPanel 
                      key={adminPanelKey}
                      onKnowledgeBaseUpdate={handleKnowledgeBaseUpdate}
                  />
              </div>
          </div>
        );
      }
      
      if (isKnowledgeBaseLoaded) {
        return (
          <ChatInterface 
            messages={messages} 
            onSendMessage={handleSendMessage} 
            isLoading={isLoading}
            language={language}
            drawings={drawings}
          />
        );
      }
      
      return (
          <div className="flex-grow flex flex-col items-center justify-center text-center p-8 text-gray-500">
              <WrenchScrewdriverIcon className="h-16 w-16 mb-4 text-gray-400" />
              <h2 className="text-2xl font-bold text-gray-700">Knowledge Base Not Loaded</h2>
              <p className="mt-2 max-w-md">
                  The AI assistant is not yet configured. Please use the Admin Panel to upload troubleshooting documents.
              </p>
          </div>
      );
    };

    return (
        <div className="flex flex-col h-screen max-w-4xl mx-auto font-sans bg-gray-100">
          <Header 
            onReset={handleReset} 
            isSheetLoaded={isKnowledgeBaseLoaded} 
            language={language}
            onLanguageChange={setLanguage}
            view={view}
            onViewToggle={handleViewToggle}
          />
          <main className="flex-grow flex flex-col p-4 overflow-y-auto">
            {renderContent()}
          </main>
        </div>
    );
  };

  return renderAppStatus();
}