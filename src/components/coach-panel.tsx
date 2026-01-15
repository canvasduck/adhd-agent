'use client';

import { cn } from '@/lib/utils';
import { X, Send, Loader2, RotateCcw } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AuthModal } from '@/components/auth-modal';
import { useAuth } from '@/lib/auth/context';
import type { Message } from '@/types';

interface CoachPanelProps {
  open: boolean;
  onClose: () => void;
}

const SUGGESTED_CHIPS = [
  "I'm struggling to start",
  "This feels overwhelming",
  "Help me break this down",
  "I finished something!",
  "I keep getting distracted",
  "What should I do next?",
];

export function CoachPanel({ open, onClose }: CoachPanelProps) {
  const { isAuthenticated } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  const resetChat = () => {
    setMessages([]);
    setInput('');
    setStreamingContent('');
  };

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      conversation_id: '',
      role: 'user',
      content: content.trim(),
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setStreamingContent('');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          history: messages,
        }),
      });

      if (!response.ok) throw new Error('Failed to send message');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error('No response body');

      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        fullContent += chunk;
        setStreamingContent(fullContent);
      }

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        conversation_id: '',
        role: 'assistant',
        content: fullContent,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setStreamingContent('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChipClick = (chip: string) => {
    sendMessage(chip);
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 animate-fade-in"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-2xl shadow-2xl animate-slide-up max-h-[85vh] flex flex-col">
        {/* Handle */}
        <div className="flex justify-center pt-2">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Your Coach</h2>
          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <button
                onClick={resetChat}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                title="New chat"
              >
                <RotateCcw className="h-5 w-5 text-gray-500" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && !streamingContent && (
            <div className="bg-indigo-50 rounded-2xl p-4">
              <p className="text-gray-700">
                Hey! What&apos;s on your mind? I&apos;m here to help you tackle whatever&apos;s
                in your way.
              </p>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'rounded-2xl p-4 max-w-[85%]',
                message.role === 'user'
                  ? 'bg-gray-100 ml-auto'
                  : 'bg-indigo-50'
              )}
            >
              <p className="text-gray-700 whitespace-pre-wrap">{message.content}</p>
            </div>
          ))}

          {streamingContent && (
            <div className="bg-indigo-50 rounded-2xl p-4 max-w-[85%]">
              <p className="text-gray-700 whitespace-pre-wrap">{streamingContent}</p>
            </div>
          )}

          {isLoading && !streamingContent && (
            <div className="bg-indigo-50 rounded-2xl p-4 max-w-[85%]">
              <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Chips */}
        {messages.length === 0 && (
          <div className="px-4 pb-2">
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_CHIPS.map((chip) => (
                <button
                  key={chip}
                  onClick={() => handleChipClick(chip)}
                  disabled={isLoading}
                  className="px-3 py-1.5 rounded-full bg-gray-100 text-sm text-gray-700 hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-gray-100 pb-safe">
          {isAuthenticated ? (
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
                placeholder="Type a message..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                onClick={() => sendMessage(input)}
                disabled={isLoading || !input.trim()}
                size="icon"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
              <p className="text-gray-500 text-sm">
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="text-indigo-600 hover:text-indigo-700 font-medium underline"
                >
                  Sign in
                </button>
                {' '}to send custom messages and unlock the full coaching experience.
              </p>
            </div>
          )}
        </div>
      </div>

      <AuthModal open={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  );
}
