
import React, { useState } from 'react';
import { X, Send, AlertCircle, CheckCircle2, MessageSquare } from 'lucide-react';
import { db, auth } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../../lib/error-handling';
import { Feedback } from '../../types';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  showToast: (message: string) => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose, showToast }) => {
  const [category, setCategory] = useState<Feedback['category']>('General Feedback');
  const [message, setMessage] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      showToast('Пікіріңізді жазыңыз! ⚠️');
      return;
    }

    setIsSubmitting(true);
    try {
      const user = auth.currentUser;
      const feedbackData: any = {
        category,
        message,
        status: 'new',
        createdAt: serverTimestamp()
      };

      if (user?.uid) feedbackData.userId = user.uid;
      if (user?.displayName) feedbackData.userName = user.displayName;
      if (user?.email) feedbackData.userEmail = user.email;
      if (contactInfo.trim()) feedbackData.contactInfo = contactInfo.trim();

      await addDoc(collection(db, 'feedback'), feedbackData);
      
      showToast('Пікіріңіз қабылданды! Рақмет! ❤️');
      setMessage('');
      setContactInfo('');
      onClose();
    } catch (err) {
      console.error('Feedback submission error:', err);
      handleFirestoreError(err, OperationType.CREATE, 'feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay show" onClick={onClose}>
      <div className="modal-content max-w-lg w-full fu" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-l flex items-center justify-center text-blue">
              <MessageSquare size={22} />
            </div>
            <div>
              <h2 className="text-xl font-black">Кері байланыс</h2>
              <p className="text-sm text-slate-500">Платформаны жақсартуға көмектесіңіз</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="fg">
            <label className="flabel">Санат</label>
            <div className="grid grid-cols-3 gap-2">
              {(['Bug Report', 'Suggestion', 'General Feedback'] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`pill ${category === cat ? 'on' : ''} text-center justify-center`}
                >
                  {cat === 'Bug Report' ? 'Қате' : cat === 'Suggestion' ? 'Ұсыныс' : 'Жалпы'}
                </button>
              ))}
            </div>
          </div>

          <div className="fg">
            <label className="flabel">Хабарлама</label>
            <textarea
              className="inp min-h-[120px]"
              placeholder="Өз ойыңызбен бөлісіңіз немесе қате туралы жазыңыз..."
              value={message}
              onChange={e => setMessage(e.target.value)}
              required
            />
          </div>

          <div className="fg">
            <label className="flabel">Байланыс мәліметтері (міндетті емес)</label>
            <input
              type="text"
              className="inp"
              placeholder="Email немесе телефон нөмірі"
              value={contactInfo}
              onChange={e => setContactInfo(e.target.value)}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn btn-ghost flex-1">
              Болдырмау
            </button>
            <button 
              type="submit" 
              className="btn btn-primary flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Жіберілуде...
                </div>
              ) : (
                <>
                  <Send size={18} />
                  Жіберу
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
