
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { ArrowRight, Key } from 'lucide-react';
import { motion } from 'motion/react';
import { chatWithTeacher } from '../services/geminiService';

interface ChatViewProps {
  isApiOk: boolean;
  onOpenApiModal: () => void;
}

export const ChatView: React.FC<ChatViewProps> = ({ isApiOk, onOpenApiModal }) => {
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'Сәлем! Мен DostUstaz-пын. Бүгін не үйренгің келеді?' }
  ]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || isThinking) return;

    const userMsg = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsThinking(true);

    const aiResponse = await chatWithTeacher(input);
    setMessages(prev => [...prev, { role: 'ai', text: aiResponse || 'Қате орын алды.' }]);
    setIsThinking(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fu h-full flex flex-col"
    >
      <div className="chat-wrap">
        <div className="chat-header">
          <div className="chat-avatar bg-emerald-600 text-white">D</div>
          <div className="chat-hinfo">
            <h3 translate="no">DostUstaz</h3>
            <p>Желіде • AI Көмекші</p>
          </div>
        </div>

        <div className="chat-msgs">
          {!isApiOk && (
            <div className="mx-4 mt-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center text-orange-600">
                  <Key size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-orange-800 dark:text-orange-200">API Кілті қажет</h4>
                  <p className="text-xs text-orange-700 dark:text-orange-300">AI Чатты пайдалану үшін Gemini API кілтін енгізіңіз.</p>
                </div>
              </div>
              <button className="btn btn-primary btn-sm" onClick={onOpenApiModal}>Кілтті қосу</button>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`msg ${msg.role === 'user' ? 'user' : 'ai'}`}>
              {msg.role === 'ai' && <div className="msg-avatar bg-emerald-600 text-white">D</div>}
              <div className="msg-bubble markdown-body" translate="no">
                <ReactMarkdown>{msg.text}</ReactMarkdown>
              </div>
            </div>
          ))}
          {isThinking && (
            <div className="msg ai">
              <div className="msg-avatar bg-emerald-600 text-white">D</div>
              <div className="chat-thinking">
                <span></span><span></span><span></span>
              </div>
            </div>
          )}
        </div>

        <div className="chat-prompts">
          {['Математикадан есеп шығару', 'Физика заңдары', 'Ағылшын грамматикасы'].map((p, i) => (
            <button key={i} className="chat-prompt-btn" onClick={() => setInput(p)}>
              {p}
            </button>
          ))}
        </div>

        <div className="chat-input-area">
          <textarea 
            className="chat-inp" 
            placeholder="Сұрағыңызды жазыңыз..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          ></textarea>
          <button className="chat-send" onClick={handleSend} disabled={isThinking}>
            <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
