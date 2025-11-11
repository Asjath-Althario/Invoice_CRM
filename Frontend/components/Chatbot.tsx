import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Bot } from 'lucide-react';
import { apiService } from '../services/api';

const Chatbot: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<{ role: 'user' | 'model', text: string }[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Add an initial greeting message from the bot
        setMessages([{ role: 'model', text: 'Hello! How can I help you navigate the Zenith ERP Suite today?' }]);
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userInput.trim() || isLoading) return;

        const userMessage = { role: 'user' as const, text: userInput };
        setMessages(prev => [...prev, userMessage]);
        setUserInput('');
        setIsLoading(true);

        try {
            const resp: any = await apiService.chat(userInput, messages);
            const text = typeof resp === 'string' ? resp : (resp?.response || resp?.message || 'No response');
            const modelMessage = { role: 'model' as const, text };
            setMessages(prev => [...prev, modelMessage]);
        } catch (error: any) {
            console.error('Error sending message to backend:', error);
            const errorText = (typeof error?.message === 'string' && error.message.includes('AI is not configured'))
                ? 'AI is not configured on the server. Please set GEMINI_API_KEY.'
                : 'Sorry, I encountered an error. Please try again.';
            const errorMessage = { role: 'model' as const, text: errorText };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 right-6 bg-primary text-white p-4 rounded-full shadow-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-transform hover:scale-110 z-50"
                aria-label="Open AI assistant"
            >
                <MessageSquare size={24} />
            </button>
            
            {isOpen && (
                <div className="fixed bottom-20 right-6 w-full max-w-sm h-[70vh] max-h-[600px] bg-white dark:bg-gray-800 rounded-lg shadow-2xl flex flex-col animate-fade-in-up z-50 border dark:border-gray-700">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b dark:border-gray-700 flex-shrink-0">
                        <div className="flex items-center">
                            <Bot size={20} className="text-primary mr-2" />
                            <h3 className="font-bold text-lg dark:text-white">AI Assistant</h3>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="p-1 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full" aria-label="Close chat">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-grow p-4 overflow-y-auto space-y-4">
                        {messages.map((msg, index) => (
                            <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                                {msg.role === 'model' && <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0"><Bot size={18} className="text-primary"/></div>}
                                <div className={`px-4 py-2 rounded-xl max-w-xs ${msg.role === 'user' ? 'bg-primary text-white rounded-br-none' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-none'}`}>
                                    <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0"><Bot size={18} className="text-primary"/></div>
                                <div className="px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-xl rounded-bl-none">
                                    <div className="flex items-center space-x-1">
                                        <span className="w-2 h-2 bg-primary rounded-full animate-pulse delay-75"></span>
                                        <span className="w-2 h-2 bg-primary rounded-full animate-pulse delay-150"></span>
                                        <span className="w-2 h-2 bg-primary rounded-full animate-pulse delay-300"></span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Form */}
                    <div className="p-4 border-t dark:border-gray-700 flex-shrink-0">
                        <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                            <input
                                type="text"
                                value={userInput}
                                onChange={(e) => setUserInput(e.target.value)}
                                placeholder="Ask a question..."
                                className="w-full px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
                                disabled={isLoading}
                            />
                            <button
                                type="submit"
                                disabled={isLoading || !userInput.trim()}
                                className="p-2 bg-primary text-white rounded-full disabled:bg-primary/50 disabled:cursor-not-allowed hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                            >
                                <Send size={18} />
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default Chatbot;
