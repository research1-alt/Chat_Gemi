import React, { useState, useCallback, useEffect, useRef } from 'react';
import ChatWindow from './components/ChatWindow';
import IntroPage from './components/IntroPage';
import AuthPage from './components/AuthPage';
import FileUpload from './components/FileUpload';
import { ChatMessage } from './types';
import { getChatbotResponse } from './services/geminiService';
import { addFile, deleteAllFiles, getAllFiles, StoredFile } from './utils/db';
import { matelEvKnowledgeBase } from './defaultLibrary';
import useAuth, { User } from './hooks/useAuth';

const languageOptions = {
    'en-US': 'English',
    'hi-IN': 'Hindi (हिन्दी)',
    'pa-IN': 'Punjabi (ਪੰਜਾਬੀ)',
    'ta-IN': 'Tamil (தமிழ்)',
    'kn-IN': 'Kannada (ಕನ್ನಡ)',
    'gu-IN': 'Gujarati (ગુજરાતી)',
    'mr-IN': 'Marathi (मराठी)',
    'bn-IN': 'Bengali (বাংলা)',
    'te-IN': 'Telugu (తెలుగు)',
    'ml-IN': 'Malayalam (മലയാളം)',
    'ur-IN': 'Urdu (اردو)',
    'as-IN': 'Assamese (অসমীয়া)',
    'or-IN': 'Odia (ଓଡ଼ିଆ)',
};

type DeviceView = 'desktop' | 'tablet' | 'mobile';

const App: React.FC = () => {
  const { user, view, setView, login, signup, logout, authError, isAuthLoading } = useAuth();

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
        const savedMessages = localStorage.getItem('app-messages');
        return savedMessages ? JSON.parse(savedMessages) : [];
    } catch {
        return [];
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [knowledgeBase, setKnowledgeBase] = useState<{ content: string; fileCount: number } | null>(null);
  const [language, setLanguage] = useState(() => {
    try {
        const savedLang = localStorage.getItem('app-language');
        return savedLang ? JSON.parse(savedLang) : 'en-US';
    } catch {
        return 'en-US';
    }
  });
  const [deviceView, setDeviceView] = useState<DeviceView>('desktop');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [isRatingSubmitting, setIsRatingSubmitting] = useState(false);
  const [ratingStatus, setRatingStatus] = useState<'idle' | 'success'>('idle');

  const [feedbackText, setFeedbackText] = useState('');
  const [isFeedbackSubmitting, setIsFeedbackSubmitting] = useState(false);
  const [feedbackStatus, setFeedbackStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const menuRef = useRef<HTMLDivElement>(null);

  const handleFileError = useCallback((errorMessage: string) => {
    console.error(`File Error: ${errorMessage}`);
    const errorBotMessage: ChatMessage = {
      id: `system-error-${Date.now()}`,
      sender: 'bot',
      text: `An error occurred: ${errorMessage}`,
    };
    setMessages(prev => [...prev, errorBotMessage]);
  }, []);

  const loadKnowledgeBase = useCallback(async () => {
    try {
        const allDbFiles = await getAllFiles();
        const filesToLoad = allDbFiles.length > 0 ? allDbFiles : matelEvKnowledgeBase;

        if (filesToLoad.length > 0) {
            const combinedContent = filesToLoad
                .map(f => `--- Content from ${f.name} ---\n${f.content}`)
                .join('\n\n');
            setKnowledgeBase({ content: combinedContent, fileCount: filesToLoad.length });
        } else {
            setKnowledgeBase(null);
        }
    } catch (error) {
        console.error("Failed to load knowledge base from DB:", error);
        handleFileError("Failed to load knowledge base from your library.");
        setKnowledgeBase(null);
    }
  }, [handleFileError]);

  const startChatSession = useCallback(async () => {
    await loadKnowledgeBase(); 

    setMessages(prevMessages => {
        if (prevMessages.length === 0 || prevMessages.every(m => m.id.startsWith('system-'))) {
            const welcomeParts = [];
            welcomeParts.push('Welcome to the OSM Service Intern!');
            welcomeParts.push("I am your assistant, How may I help you?");

            return [{
                id: 'initial-bot-message',
                text: welcomeParts.join(' '),
                sender: 'bot'
            }];
        }
        return prevMessages;
    });
  }, [loadKnowledgeBase]);


  useEffect(() => {
    localStorage.setItem('app-messages', JSON.stringify(messages));
    localStorage.setItem('app-language', JSON.stringify(language));
  }, [messages, language]);
  
  useEffect(() => {
    if (view === 'chat' && user) {
        startChatSession();
    }
  }, [view, user, startChatSession]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
      logout();
      setMessages([]);
      setKnowledgeBase(null);
  }

  const handleSendMessage = useCallback(async (messageText: string, lang: string) => {
    const newUserMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      text: messageText,
      sender: 'user',
    };

    setMessages(prevMessages => [...prevMessages, newUserMessage]);
    setIsLoading(true);

    try {
      const { text: botResponseText, suggestions, imageUrl } = await getChatbotResponse(messageText, messages, knowledgeBase?.content ?? null, lang);
      const newBotMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        text: botResponseText,
        sender: 'bot',
        suggestions: suggestions,
        imageUrl: imageUrl ?? undefined,
      };
      setMessages(prevMessages => [...prevMessages, newBotMessage]);
    } catch (error) {
      console.error(error);
      const errorMessage: ChatMessage = {
        id: `bot-error-${Date.now()}`,
        text: "I'm sorry, I encountered an error. Please try again.",
        sender: 'bot',
      };
      setMessages(prevMessages => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, knowledgeBase]);
  
  const handleSuggestionClick = useCallback((suggestionText: string, messageId: string) => {
    setMessages(prevMessages =>
      prevMessages.map(msg =>
        msg.id === messageId ? { ...msg, suggestions: undefined } : msg
      )
    );
    handleSendMessage(suggestionText, language);
  }, [handleSendMessage, language]);

  const handleClarificationRequest = useCallback((messageId: string) => {
    const messageToClarify = messages.find(msg => msg.id === messageId);
    if (messageToClarify) {
      const clarificationPrompt = `That explanation was not clear enough. Can you rephrase the following response with more detail or a different approach?\n\nPREVIOUS RESPONSE:\n"${messageToClarify.text}"`;
      setMessages(prev => prev.map(msg => 
          msg.id === messageId ? { ...msg, suggestions: undefined } : msg
      ));
      handleSendMessage(clarificationPrompt, language);
    }
  }, [messages, handleSendMessage, language]);

  const handleLanguageChange = useCallback((lang: string) => {
    setLanguage(lang);
  }, []);

  const handleFilesStored = useCallback(async (files: StoredFile[]) => {
    try {
        for (const file of files) {
            await addFile(file);
        }
        await loadKnowledgeBase();
        setIsMenuOpen(false);
        
        const successMessage: ChatMessage = {
            id: `system-success-${Date.now()}`,
            sender: 'bot',
            text: `${files.length} file(s) successfully added to the knowledge base. The assistant will now use this new context.`,
        };
        setMessages(prev => [...prev, successMessage]);

    } catch (error) {
        console.error("Failed to store files:", error);
        handleFileError("Could not save the uploaded files.");
    }
  }, [loadKnowledgeBase, handleFileError]);

  const handleClearKnowledgeBase = useCallback(async () => {
    if (window.confirm("Are you sure you want to clear the entire knowledge base? This action cannot be undone.")) {
        try {
            await deleteAllFiles();
            await loadKnowledgeBase();
            setIsMenuOpen(false);

            const clearMessage: ChatMessage = {
                id: `system-info-${Date.now()}`,
                sender: 'bot',
                text: "Knowledge base has been cleared. The assistant will revert to its default knowledge base. You can now upload new files.",
            };
            setMessages(prev => [...prev, clearMessage]);

        } catch (error) {
            console.error("Failed to clear knowledge base:", error);
            handleFileError("An error occurred while clearing the knowledge base.");
        }
    }
  }, [loadKnowledgeBase, handleFileError]);

  const handleRatingSubmit = useCallback(async () => {
    if (rating === 0 || !user) return;
    setIsRatingSubmitting(true);
    
    await new Promise(res => setTimeout(res, 500));
    try {
        const ratings = JSON.parse(localStorage.getItem('app-ratings') || '[]');
        const newRating = {
            rating: rating,
            user: user.email,
            timestamp: new Date().toISOString(),
        };
        ratings.push(newRating);
        localStorage.setItem('app-ratings', JSON.stringify(ratings));
        setRatingStatus('success');
    } catch (error) {
        console.error("Failed to save rating:", error);
    } finally {
        setIsRatingSubmitting(false);
    }
  }, [rating, user]);


  const handleFeedbackSubmit = useCallback(async () => {
    if (!feedbackText.trim() || !user) return;
    
    setIsFeedbackSubmitting(true);
    setFeedbackStatus('idle');

    await new Promise(res => setTimeout(res, 500)); // Simulate network delay

    try {
        const feedbacks = JSON.parse(localStorage.getItem('app-feedback') || '[]');
        const newFeedback = {
            text: feedbackText,
            user: user.email,
            timestamp: new Date().toISOString(),
        };
        feedbacks.push(newFeedback);
        localStorage.setItem('app-feedback', JSON.stringify(feedbacks));
        
        setFeedbackStatus('success');
        setFeedbackText('');
        setTimeout(() => setFeedbackStatus('idle'), 3000);
    } catch (error) {
        console.error("Failed to save feedback:", error);
        setFeedbackStatus('error');
    } finally {
        setIsFeedbackSubmitting(false);
    }
  }, [feedbackText, user]);

  if (!user) {
    if (view === 'auth') {
        return (
          <AuthPage
            onLogin={login}
            onSignup={signup}
            error={authError}
            isLoading={isAuthLoading}
          />
        );
    }
    return <IntroPage onStart={() => setView('auth')} />;
  }
  
  const getDeviceFrameClasses = () => {
    switch (deviceView) {
        case 'mobile':
            return 'w-[375px] h-[95%] max-w-full max-h-full flex flex-col bg-white shadow-2xl rounded-3xl border-8 border-gray-800 p-1 box-content transition-all duration-300 relative overflow-hidden';
        case 'tablet':
            return 'w-[768px] h-[95%] max-w-full max-h-full flex flex-col bg-white shadow-2xl rounded-3xl border-8 border-gray-800 p-1 box-content transition-all duration-300 relative overflow-hidden';
        default: // desktop
            return 'w-full h-full flex flex-col bg-white shadow-lg rounded-lg overflow-hidden';
    }
  };
  
  const getDeviceNotch = () => {
      if (deviceView === 'desktop') return null;
      return (
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 bg-gray-800 rounded-b-xl z-10 ${deviceView === 'mobile' ? 'w-28 h-5' : 'w-36 h-6'}`}></div>
      );
  }

  const DeviceViewSelector = () => (
      <div className="flex items-center gap-1 p-0.5 bg-gray-200 rounded-md w-full justify-center">
          <button 
              onClick={() => setDeviceView('desktop')} 
              title="Desktop View" 
              aria-pressed={deviceView === 'desktop'}
              className={`p-1.5 rounded-md transition-colors flex-1 flex justify-center ${deviceView === 'desktop' ? 'bg-white shadow-sm' : 'hover:bg-gray-300'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
          </button>
          <button 
              onClick={() => setDeviceView('tablet')} 
              title="Tablet View" 
              aria-pressed={deviceView === 'tablet'}
              className={`p-1.5 rounded-md transition-colors flex-1 flex justify-center ${deviceView === 'tablet' ? 'bg-white shadow-sm' : 'hover:bg-gray-300'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
          </button>
          <button 
              onClick={() => setDeviceView('mobile')} 
              title="Mobile View" 
              aria-pressed={deviceView === 'mobile'}
              className={`p-1.5 rounded-md transition-colors flex-1 flex justify-center ${deviceView === 'mobile' ? 'bg-white shadow-sm' : 'hover:bg-gray-300'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75A2.25 2.25 0 0015.75 1.5h-2.25" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 18h3" />
              </svg>
          </button>
      </div>
  );
  
  const Star = ({ filled }: { filled: boolean }) => (
    <svg className={`w-6 h-6 ${filled ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );

  return (
    <div className="h-screen w-screen bg-gray-100 flex items-center justify-center font-sans text-gray-900 p-4">
      <div className={getDeviceFrameClasses()}>
          {getDeviceNotch()}
          <header className="p-4 border-b border-gray-200 bg-white flex justify-between items-center flex-shrink-0 z-20">
            <h1 className="text-xl font-bold text-gray-800">OSM Service Intern</h1>
            <div className="relative">
                <button 
                    onClick={() => setIsMenuOpen(prev => !prev)} 
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
                    aria-label="Open menu"
                    aria-haspopup="true"
                    aria-expanded={isMenuOpen}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
                {isMenuOpen && (
                    <div ref={menuRef} className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-30 flex flex-col gap-y-4 text-sm">
                        
                        {/* User Info Section */}
                        {user && (
                            <div className="border-b border-gray-200 pb-4 flex flex-col items-start">
                                <span className="font-semibold text-gray-800 text-base">Welcome, {user.name}</span>
                            </div>
                        )}

                        {/* Knowledge Base Section */}
                        <div className="border-b border-gray-200 pb-4 flex flex-col gap-3">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Knowledge Base</h3>
                            <div className="text-gray-600">
                                {knowledgeBase && getAllFiles.length > 0
                                    ? `${knowledgeBase.fileCount} custom file(s) loaded.`
                                    : "Default knowledge base loaded."
                                }
                            </div>
                            <FileUpload onFilesStored={handleFilesStored} onError={handleFileError} />
                            {knowledgeBase && getAllFiles.length > 0 && (
                                 <button onClick={handleClearKnowledgeBase} className="w-full text-left text-sm font-medium text-gray-700 hover:bg-gray-100 p-2 rounded-md transition-colors">Clear Knowledge Base</button>
                            )}
                        </div>

                        {/* View Options Section */}
                        <div className="border-b border-gray-200 pb-4 flex flex-col gap-3">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Device View</h3>
                            <DeviceViewSelector />
                        </div>
                        
                        {/* Language Section */}
                        <div className="border-b border-gray-200 pb-4 flex flex-col gap-3">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Language</h3>
                            <div className="flex items-center justify-between">
                                <label htmlFor="language-select-menu" className="font-medium text-gray-700">Interface Language</label>
                                <div className="relative">
                                    <select
                                        id="language-select-menu"
                                        value={language}
                                        onChange={(e) => handleLanguageChange(e.target.value)}
                                        className="appearance-none rounded-md border border-gray-300 bg-white py-1 pl-2 pr-7 text-gray-800 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                                        aria-label="Select language"
                                    >
                                        {Object.entries(languageOptions).map(([code, name]) => (
                                            <option key={code} value={code}>{name}</option>
                                        ))}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                                        <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Rating Section */}
                        <div className="border-b border-gray-200 pb-4 flex flex-col gap-3">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Rate Us</h3>
                            <div className="flex justify-center items-center gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        onClick={() => ratingStatus !== 'success' && setRating(star)}
                                        onMouseEnter={() => ratingStatus !== 'success' && setHoverRating(star)}
                                        onMouseLeave={() => setHoverRating(0)}
                                        className="focus:outline-none"
                                        aria-label={`Rate ${star} out of 5 stars`}
                                        disabled={ratingStatus === 'success'}
                                    >
                                        <Star filled={(hoverRating || rating) >= star} />
                                    </button>
                                ))}
                            </div>
                            <div className="flex items-center justify-between mt-2">
                                 <div className="h-5">
                                    {ratingStatus === 'success' && <p className="text-xs text-green-600">Thanks for your rating!</p>}
                                </div>
                                <button 
                                    onClick={handleRatingSubmit}
                                    disabled={isRatingSubmitting || rating === 0 || ratingStatus === 'success'}
                                    className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                >
                                    {ratingStatus === 'success' ? 'Submitted' : (isRatingSubmitting ? 'Submitting...' : 'Submit Rating')}
                                </button>
                            </div>
                        </div>

                        {/* Feedback Section */}
                        <div className="flex flex-col gap-3">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Feedback</h3>
                            <textarea 
                                value={feedbackText}
                                onChange={(e) => setFeedbackText(e.target.value)}
                                placeholder="Share your feedback about the assistant..."
                                className="w-full h-20 p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                                aria-label="Feedback input"
                            />
                            <div className="flex items-center justify-between">
                                <div className="h-5">
                                    {feedbackStatus === 'success' && <p className="text-xs text-green-600">Feedback submitted. Thank you!</p>}
                                    {feedbackStatus === 'error' && <p className="text-xs text-red-600">Could not submit feedback.</p>}
                                </div>
                                <button 
                                    onClick={handleFeedbackSubmit}
                                    disabled={isFeedbackSubmitting || !feedbackText.trim()}
                                    className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                >
                                    {isFeedbackSubmitting ? 'Submitting...' : 'Submit'}
                                </button>
                            </div>
                        </div>

                        {/* Logout Section */}
                        {user && (
                            <div className="border-t border-gray-200 pt-4">
                                 <button onClick={handleLogout} className="w-full text-left text-sm font-medium text-red-600 hover:bg-red-50 p-2 rounded-md transition-colors">Logout</button>
                            </div>
                        )}
                    </div>
                )}
            </div>
          </header>
          <div className="flex-1 min-h-0">
              <ChatWindow 
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  isLoading={isLoading}
                  selectedLanguage={language}
                  onSuggestionClick={handleSuggestionClick}
                  onClarificationRequest={handleClarificationRequest}
              />
          </div>
      </div>
    </div>
  );
};

export default App;