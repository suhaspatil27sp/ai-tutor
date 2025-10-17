'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Send,
  LogOut,
  Loader2,
  AlertCircle,
  RefreshCw,
  User,
  Bot,
} from 'lucide-react';
import type { User, Session, ChatMessage } from '@/types';

interface AITutorProps {
  user: User;
}

export default function AITutor({ user }: AITutorProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    initializeSession();
  }, [user.user_id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    adjustTextareaHeight();
  }, [inputText]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
    }
  };

  const initializeSession = async () => {
    try {
      setLoading(true);
      setError('');

      // Check for active session
      const sessionResponse = await fetch(`/api/session?user_id=${user.user_id}`);
      const sessionData = await sessionResponse.json();

      let activeSession = sessionData.session;

      // Create new session if none exists
      if (!activeSession) {
        const createResponse = await fetch('/api/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user.user_id,
            device_info: navigator.userAgent,
          }),
        });
        const createData = await createResponse.json();
        activeSession = createData.session;
      }

      setSession(activeSession);

      // Load previous messages
      const messagesResponse = await fetch(
        `/api/chat?session_id=${activeSession.session_id}`
      );
      const messagesData = await messagesResponse.json();

      const loadedMessages: ChatMessage[] = messagesData.messages.map(
        (msg: any) => ({
          id: msg.message_id,
          text: msg.message_text,
          sender: msg.sender_type,
          timestamp: new Date(msg.sent_at),
          status: 'sent',
        })
      );

      setMessages(loadedMessages);

      // Add welcome message if no messages
      if (loadedMessages.length === 0) {
        const welcomeMessage: ChatMessage = {
          id: 'welcome',
          text: `Hi ${user.first_name}! 👋 I'm your AI tutor. I'm here to help you learn and understand your subjects better. What would you like to study today?`,
          sender: 'bot',
          timestamp: new Date(),
          status: 'sent',
        };
        setMessages([welcomeMessage]);
      }
    } catch (err) {
      setError('Failed to initialize session. Please refresh the page.');
      console.error('Session initialization error:', err);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || !session || sending) return;

    const messageText = inputText.trim();
    const tempId = `temp_${Date.now()}`;

    // Optimistic update
    const userMessage: ChatMessage = {
      id: tempId,
      text: messageText,
      sender: 'user',
      timestamp: new Date(),
      status: 'sending',
      tempId,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setSending(true);
    setError('');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: session.session_id,
          user_id: user.user_id,
          message_text: messageText,
          temp_id: tempId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();

      // Update user message with server response
      setMessages((prev) =>
        prev.map((msg) =>
          msg.tempId === tempId
            ? {
                ...msg,
                id: data.userMessage.message_id,
                status: 'sent',
              }
            : msg
        )
      );

      // Add bot response
      const botMessage: ChatMessage = {
        id: data.botMessage.message_id,
        text: data.botMessage.message_text,
        sender: 'bot',
        timestamp: new Date(data.botMessage.sent_at),
        status: 'sent',
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      console.error('Send message error:', err);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.tempId === tempId ? { ...msg, status: 'failed' } : msg
        )
      );
      setError('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const retryMessage = async (tempId: string) => {
    const failedMessage = messages.find((msg) => msg.tempId === tempId);
    if (!failedMessage) return;

    setMessages((prev) =>
      prev.map((msg) =>
        msg.tempId === tempId ? { ...msg, status: 'sending' } : msg
      )
    );

    setInputText(failedMessage.text);
    await sendMessage();
  };

  const handleLogout = async () => {
    if (session) {
      await fetch(`/api/session/${session.session_id}`, {
        method: 'DELETE',
      });
    }
    localStorage.removeItem('ai_tutor_user_id');
    window.location.reload();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading your session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
            <Bot className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="font-semibold text-gray-900">AI Tutor</h1>
            <p className="text-sm text-gray-500">
              Grade {user.grade_level} • {user.education_board}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${
              message.sender === 'user' ? 'flex-row-reverse' : ''
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                message.sender === 'user'
                  ? 'bg-indigo-600'
                  : 'bg-gray-200'
              }`}
            >
              {message.sender === 'user' ? (
                <User className="w-5 h-5 text-white" />
              ) : (
                <Bot className="w-5 h-5 text-gray-600" />
              )}
            </div>
            <div
              className={`flex-1 max-w-2xl ${
                message.sender === 'user' ? 'text-right' : ''
              }`}
            >
              <div
                className={`inline-block px-4 py-2 rounded-2xl ${
                  message.sender === 'user'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-900 border border-gray-200'
                }`}
              >
                <p className="whitespace-pre-wrap break-words">
                  {message.text}
                </p>
              </div>
              <div className="flex items-center gap-2 mt-1 px-1">
                <span className="text-xs text-gray-500">
                  {message.timestamp.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                {message.status === 'sending' && (
                  <Loader2 className="w-3 h-3 animate-spin text-gray-400" />
                )}
                {message.status === 'failed' && (
                  <button
                    onClick={() => message.tempId && retryMessage(message.tempId)}
                    className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700"
                  >
                    <AlertCircle className="w-3 h-3" />
                    <span>Retry</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Error Banner */}
      {error && (
        <div className="px-4 py-3 bg-red-50 border-t border-red-200">
          <div className="flex items-center gap-2 text-sm text-red-600">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
            <button
              onClick={() => setError('')}
              className="ml-auto text-red-600 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="bg-white border-t border-gray-200 px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-end gap-2">
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything..."
              rows={1}
              disabled={sending}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none bg-white text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ maxHeight: '150px' }}
            />
            <button
              onClick={sendMessage}
              disabled={!inputText.trim() || sending}
              className="bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            >
              {sending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}