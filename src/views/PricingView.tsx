
import React from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

export const PricingView: React.FC = () => {
  const plans = [
    { name: 'Тегін', price: '0 ₸', period: 'мәңгілік', features: ['AI Мұғалім (шектеулі)', 'Негізгі курстар', 'Ойындар (күніне 3 рет)', 'Жарнамамен'], featured: false },
    { name: 'Pro', price: '2,900 ₸', period: 'айына', features: ['AI Мұғалім (шектеусіз)', 'Барлық курстар', 'Ойындар (шектеусіз)', 'Жарнамасыз', 'Сертификаттар'], featured: true },
    { name: 'Student', price: '1,500 ₸', period: 'айына', features: ['AI Мұғалім (шектеусіз)', 'Барлық курстар', 'Ойындар (шектеусіз)', 'Студенттік жеңілдік'], featured: false }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fu"
    >
      <div className="text-center mb-10">
        <h2 className="text-3xl font-black mb-2">Өзіңізге ыңғайлы тарифті таңдаңыз</h2>
        <p className="text-slate-500">Білім алуды бүгіннен бастаңыз</p>
      </div>

      <div className="pricing-grid">
        {plans.map((plan, i) => (
          <div key={i} className={`price-card ${plan.featured ? 'featured' : ''}`}>
            <div className="price-name">{plan.name}</div>
            <div className="price-amount">{plan.price}</div>
            <div className="price-period">{plan.period}</div>
            <div className="price-features">
              {plan.features.map((f, j) => (
                <div key={j} className="price-feat">
                  <CheckCircle2 size={16} className="text-green-500" />
                  {f}
                </div>
              ))}
            </div>
            <button className={`btn btn-wide ${plan.featured ? 'btn-primary' : 'btn-ghost'}`}>
              Таңдау
            </button>
          </div>
        ))}
      </div>

      <div className="card card-pad mt-10 bg-indigo-50 border-indigo-100 dark:bg-indigo-900/20 dark:border-indigo-800">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-indigo-600 shadow-sm shrink-0">
            <AlertCircle size={24} />
          </div>
          <div className="text-center sm:text-left">
            <div className="font-bold text-indigo-900 dark:text-indigo-200">Сұрақтарыңыз бар ма?</div>
            <div className="text-sm text-indigo-700 dark:text-indigo-300">Біздің қолдау көрсету орталығына хабарласыңыз.</div>
          </div>
          <button className="btn btn-sm btn-primary w-full sm:w-auto sm:ml-auto">Көмек алу</button>
        </div>
      </div>
    </motion.div>
  );
};
