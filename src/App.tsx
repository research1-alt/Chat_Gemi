import React, { useState, useCallback, useEffect } from 'react';
import { AdminPanel } from './components/AdminPanel';
import { ChatInterface } from './components/ChatInterface';
import { Header } from './components/Header';
import { Message, Drawing, User } from './types';
import { getSolution } from './services/geminiService';
import * as db from './services/db';
import { SpinnerIcon } from './components/icons/SpinnerIcon';
import { LandingPage } from './components/LandingPage';
import { WrenchScrewdriverIcon } from './components/icons/WrenchScrewdriverIcon';
import { LoginPage } from './components/LoginPage';
import { AdminSetupPage } from './components/AdminSetupPage';
import { Notification } from './components/Notification';
import { loadPreloadedKnowledgeBase } from './services/preloader';


type AppStatus = 'loading' | 'landing' | 'setup' | 'login' | 'ready';
const ADMIN_EMAIL = 'admin@service.app';

export default function App() {
  // App State
  const [appStatus, setAppStatus] = useState<AppStatus>('landing');
  
  // Auth State
  const [loggedInUser, setLoggedInUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [authError, setAuthError] = useState<string | null>(null);

  // Knowledge Base State
  const [knowledgeBaseText, setKnowledgeBaseText] = useState<string>('');
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  
  // Chat State
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [language, setLanguage] = useState<string>('en');

  // UI State
  const [view, setView] = useState<'chat' | 'admin'>('chat');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const isKnowledgeBaseLoaded = knowledgeBaseText.trim().length > 0 || drawings.length > 0;

  const loadKnowledgeBaseAndSetState = useCallback(async () => {
    try {
        const kbData = await db.loadKnowledgeBase();
        if (kbData && (kbData.text || kbData.drawings.length > 0)) {
            setKnowledgeBaseText(kbData.text);
            setDrawings(kbData.drawings);
            return;
        } 
        
        const preloadedData = await loadPreloadedKnowledgeBase();
        if (preloadedData) {
            await db.saveKnowledgeBase(preloadedData.text, preloadedData.drawings);
            setKnowledgeBaseText(preloadedData.text);
            setDrawings(preloadedData.drawings);
            setNotification({ message: 'Default knowledge base loaded.', type: 'success' });
        }
    } catch (error) {
        console.error("Error loading knowledge base:", error);
        setNotification({ message: 'Failed to load knowledge base.', type: 'error' });
    }
  }, []);

  const initializeApp = useCallback(async () => {
      setAppStatus('loading');
      try {
        const hasUsers = await db.hasUsers();
        if (!hasUsers) {
          setAppStatus('setup');
          return;
        }

        const allUsers = await db.getUsers();
        setUsers(allUsers);

        const userEmail = sessionStorage.getItem('loggedInUserEmail');
        if (userEmail) {
            const user = await db.getUserByEmail(userEmail);
            if (user) {
                setLoggedInUser(user);
                await loadKnowledgeBaseAndSetState();
                setAppStatus('ready');
            } else {
                sessionStorage.removeItem('loggedInUserEmail');
                setAppStatus('login');
            }
        } else {
            setAppStatus('login');
        }
      } catch (error) {
        console.error("Initialization error:", error);
        setAppStatus('login'); // Fallback to login on error
      }
    }, [loadKnowledgeBaseAndSetState]);


  useEffect(() => {
    if (isKnowledgeBaseLoaded && appStatus === 'ready' && messages.length === 0) {
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
    } else if (!isKnowledgeBaseLoaded && appStatus === 'ready') {
        setMessages([]);
    }
  }, [isKnowledgeBaseLoaded, appStatus, messages.length]);

  const handleAdminSetup = async (password: string) => {
    try {
        const adminUser: User = { email: ADMIN_EMAIL, password, role: 'admin' };
        await db.addUser(adminUser);
        setLoggedInUser(adminUser);
        sessionStorage.setItem('loggedInUserEmail', adminUser.email);
        setUsers([adminUser]);
        await loadKnowledgeBaseAndSetState();
        setAppStatus('ready');
    } catch (e) {
        const error = e as Error;
        setAuthError(error.message);
    }
  };

  const handleLogin = async (email: string, pass: string) => {
    setAuthError(null);
    const user = await db.getUserByEmail(email.toLowerCase());
    if (user && user.password === pass) {
        setLoggedInUser(user);
        sessionStorage.setItem('loggedInUserEmail', user.email);
        await loadKnowledgeBaseAndSetState();
        setAppStatus('ready');
    } else {
        setAuthError('Invalid email or password.');
    }
  };

  const handleLogout = () => {
      setLoggedInUser(null);
      sessionStorage.removeItem('loggedInUserEmail');
      setView('chat');
      setKnowledgeBaseText('');
      setDrawings([]);
      setMessages([]);
      setAppStatus('login');
  };

  const handleAddUser = async (email: string, password: string): Promise<string | null> => {
      try {
          const newUser: User = { email: email.toLowerCase(), password, role: 'user' };
          await db.addUser(newUser);
          const allUsers = await db.getUsers();
          setUsers(allUsers);
          setNotification({ message: `User '${email}' created successfully.`, type: 'success' });
          return null;
      } catch (e) {
          const error = e as Error;
          return error.message;
      }
  };

  const handleDeleteUser = async (email: string) => {
      await db.deleteUser(email);
      const allUsers = await db.getUsers();
      setUsers(allUsers);
      setNotification({ message: `User '${email}' has been deleted.`, type: 'success' });
  };

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
      setNotification({ message: 'Knowledge base updated successfully!', type: 'success' });
      setView('chat');
    } catch (error) {
      console.error("Failed to save knowledge base:", error);
      setNotification({ message: 'Failed to save knowledge base. Please try again.', type: 'error' });
    }
  };
  
  const handleReset = useCallback(async () => {
    if(window.confirm("Are you sure you want to reset the knowledge base? This action will clear all uploaded data and cannot be undone.")){
        setKnowledgeBaseText('');
        setDrawings([]);
        setMessages([]);
        try {
          await db.clearKnowledgeBase();
          setNotification({ message: 'Knowledge base has been cleared.', type: 'success'});
        } catch (error) {
          console.error("Failed to clear knowledge base:", error);
          setNotification({ message: 'Failed to clear knowledge base.', type: 'error'});
        }
    }
  }, []);
  
  const renderReadyState = () => {
    const renderContent = () => {
      if (view === 'admin' && loggedInUser?.role === 'admin') {
        return (
          <div className="flex-grow flex items-start justify-center pt-6">
              <div className="w-full max-w-4xl">
                  <AdminPanel 
                      onKnowledgeBaseUpdate={handleKnowledgeBaseUpdate}
                      users={users}
                      onAddUser={handleAddUser}
                      onDeleteUser={handleDeleteUser}
                      knowledgeBaseText={knowledgeBaseText}
                      drawings={drawings}
                      isKnowledgeBaseLoaded={isKnowledgeBaseLoaded}
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
                  {loggedInUser?.role === 'admin' 
                    ? "The AI assistant is not yet configured. Please use the Admin Panel to upload troubleshooting documents."
                    : "The AI assistant is not yet configured. Please contact an administrator."
                  }
              </p>
          </div>
      );
    };

    return (
        <div className="flex flex-col h-screen max-w-4xl mx-auto font-sans bg-gray-100">
          <div aria-live="assertive" className="fixed inset-0 flex items-start px-4 py-6 pointer-events-none sm:p-6 sm:items-start z-50">
            <div className="w-full flex flex-col items-center space-y-4 sm:items-end">
              {notification && (
                  <Notification
                      message={notification.message}
                      type={notification.type}
                      onClose={() => setNotification(null)}
                  />
              )}
            </div>
          </div>
          <Header 
            onReset={handleReset} 
            isSheetLoaded={isKnowledgeBaseLoaded} 
            language={language}
            onLanguageChange={setLanguage}
            view={view}
            onViewToggle={() => setView(prev => prev === 'chat' ? 'admin' : 'chat')}
            user={loggedInUser}
            onLogout={handleLogout}
          />
          <main className="flex-grow flex flex-col p-4 overflow-y-auto">
            {renderContent()}
          </main>
        </div>
    );
  };

  switch(appStatus) {
    case 'landing':
      return <LandingPage onStart={initializeApp} />;
    case 'loading':
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center flex flex-col items-center space-y-3 text-gray-600">
                    <SpinnerIcon className="h-10 w-10 animate-spin text-brand-primary" />
                    <p className="text-lg">Initializing Application...</p>
                </div>
            </div>
        );
    case 'setup':
        return <AdminSetupPage adminEmail={ADMIN_EMAIL} onSetup={handleAdminSetup} error={authError} />;
    case 'login':
        return <LoginPage onLogin={handleLogin} error={authError} />;
    case 'ready':
        return renderReadyState();
    default:
        return <div className="text-red-500 text-center p-8">Invalid application state.</div>;
  }
}
