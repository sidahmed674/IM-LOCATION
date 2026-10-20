import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { motion } from 'framer-motion';

export const PinLockScreen: React.FC = () => {
  const { unlockWithPin, language } = useApp();
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [lockTime, setLockTime] = useState('');
  const [lockDate, setLockDate] = useState('');

  React.useEffect(() => {
    const update = () => {
      const now = new Date();
      setLockTime(
        now.toLocaleTimeString(language === 'ar' ? 'ar-DZ' : (language === 'fr' ? 'fr-DZ' : 'en-US'), {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        })
      );
      setLockDate(
        now.toLocaleDateString(language === 'ar' ? 'ar-DZ' : (language === 'fr' ? 'fr-DZ' : 'en-US'), {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        })
      );
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [language]);

  // Clean and secure error messages without exposing default PIN
  const getErrorMessage = () => {
    if (language === 'ar') return 'رمز المرور غير صحيح';
    if (language === 'fr') return 'Code PIN incorrect';
    return 'Incorrect PIN code';
  };

  const getSubtitle = () => {
    if (language === 'ar') return 'أدخل رمز المرور لفتح النظام';
    if (language === 'fr') return 'Saisissez votre code PIN pour déverrouiller';
    return 'Enter your PIN to unlock terminal';
  };

  const handleDigitClick = (digit: string) => {
    if (pin.length < 6) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setErrorMsg('');
      if (nextPin.length === 4) {
        // Auto-check on 4 digits
        if (!unlockWithPin(nextPin)) {
          setErrorMsg(getErrorMessage());
          setTimeout(() => setPin(''), 600);
        }
      }
    }
  };

  const handleClear = () => {
    setPin('');
    setErrorMsg('');
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
    setErrorMsg('');
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!unlockWithPin(pin)) {
      setErrorMsg(getErrorMessage());
      setTimeout(() => setPin(''), 600);
    }
  };

  // Support real physical keyboard input directly
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleDigitClick(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Enter') {
        if (pin.length === 4) {
          handleSubmit();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 bg-neutral-950/95 backdrop-blur-md flex flex-col items-center justify-center p-4 select-none"
    >
      {/* Prominent Large Desktop Clock on Lock Screen */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
        className="text-center mb-6"
      >
        <div className="text-6xl sm:text-7xl font-black font-mono tracking-widest text-amber-400 drop-shadow-xl">
          {lockTime}
        </div>
        <div className="text-sm sm:text-base text-neutral-300 font-semibold mt-1.5 capitalize font-bukra italic">
          {lockDate}
        </div>
      </motion.div>

      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 15 }}
        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
        className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-5"
      >
        {/* Brand Icon */}
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-neutral-950 font-black text-2xl shadow-lg shadow-amber-500/20 mb-2 font-bukra italic">
            IM
          </div>
          <h2 className="text-xl font-bold font-bukra italic tracking-tight text-white">
            IM LOCATION
          </h2>
          <p className="text-sm text-neutral-400 mt-0.5">
            {getSubtitle()}
          </p>
        </div>

        {/* PIN Dots Display */}
        <div className="flex items-center justify-center gap-3.5 py-2">
          {[0, 1, 2, 3].map((idx) => (
            <motion.div
              key={idx}
              animate={{ scale: pin.length > idx ? 1.25 : 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
              className={`w-4 h-4 rounded-full transition-all duration-150 ${
                pin.length > idx
                  ? 'bg-amber-500 shadow-md shadow-amber-500/50'
                  : 'bg-neutral-800 border border-neutral-700'
              }`}
            />
          ))}
        </div>

        {errorMsg && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-sm font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/20 py-2 px-3 rounded-xl animate-shake"
          >
            {errorMsg}
          </motion.div>
        )}

        {/* Numeric Keypad for POS Touchscreen / Mouse with Spring Feedback */}
        <div className="grid grid-cols-3 gap-2.5 max-w-[280px] mx-auto">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <motion.button
              key={digit}
              type="button"
              whileTap={{ scale: 0.92 }}
              onClick={() => handleDigitClick(digit)}
              className="h-12 rounded-xl bg-neutral-800/80 hover:bg-neutral-750 active:bg-amber-500 active:text-neutral-950 text-neutral-100 font-bold text-xl transition-colors cursor-pointer border border-neutral-700/60 shadow-xs flex items-center justify-center font-mono"
            >
              {digit}
            </motion.button>
          ))}
          <motion.button
            type="button"
            whileTap={{ scale: 0.92 }}
            onClick={handleClear}
            className="h-12 rounded-xl bg-neutral-800/50 hover:bg-neutral-700 text-neutral-400 text-sm font-semibold transition-colors cursor-pointer border border-neutral-700/40"
          >
            {language === 'ar' ? 'مسح' : 'C'}
          </motion.button>
          <motion.button
            type="button"
            whileTap={{ scale: 0.92 }}
            onClick={() => handleDigitClick('0')}
            className="h-12 rounded-xl bg-neutral-800/80 hover:bg-neutral-750 active:bg-amber-500 active:text-neutral-950 text-neutral-100 font-bold text-xl transition-colors cursor-pointer border border-neutral-700/60 shadow-xs flex items-center justify-center font-mono"
          >
            0
          </motion.button>
          <motion.button
            type="button"
            whileTap={{ scale: 0.92 }}
            onClick={handleBackspace}
            className="h-12 rounded-xl bg-neutral-800/50 hover:bg-neutral-700 text-neutral-400 text-base font-semibold transition-colors cursor-pointer border border-neutral-700/40"
          >
            ⌫
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};