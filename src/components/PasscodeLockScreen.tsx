import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Lock, Unlock, AlertCircle, RefreshCw, MessageSquare, Shield } from "lucide-react";

interface PasscodeLockScreenProps {
  correctPin: string;
  onUnlock: () => void;
  adminMobile: string;
}

export function PasscodeLockScreen({ correctPin, onUnlock, adminMobile }: PasscodeLockScreenProps) {
  const [inputVal, setInputVal] = useState<string>("");
  const [wrongAttempts, setWrongAttempts] = useState<number>(0);
  const [cooldown, setCooldown] = useState<number>(0);
  const [shake, setShake] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  // Manage secure cooldown counter
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(t);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  // Listen to physical keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (cooldown > 0) return;

      if (e.key >= "0" && e.key <= "9") {
        handleNumberPress(e.key);
      } else if (e.key === "Backspace") {
        handleBackspace();
      } else if (e.key === "Escape") {
        setInputVal("");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [inputVal, cooldown]);

  // Append new passcode number
  const handleNumberPress = (num: string) => {
    if (cooldown > 0) return;
    if (inputVal.length >= 4) return;

    setErrorMsg("");
    const newVal = inputVal + num;
    setInputVal(newVal);

    // If reached 4 digits, immediately verify
    if (newVal.length === 4) {
      // Small timeout to let user see the final dot filled
      setTimeout(() => {
        verifyPasscode(newVal);
      }, 150);
    }
  };

  // Backspace key trigger
  const handleBackspace = () => {
    if (cooldown > 0) return;
    setInputVal((prev) => prev.slice(0, -1));
  };

  // Verify the passcode code
  const verifyPasscode = (pin: string) => {
    if (pin === correctPin) {
      setInputVal("");
      setWrongAttempts(0);
      setErrorMsg("");
      // Trigger unlock success
      onUnlock();
    } else {
      setShake(true);
      setInputVal("");
      const nextWrong = wrongAttempts + 1;
      setWrongAttempts(nextWrong);

      setTimeout(() => setShake(false), 500);

      if (nextWrong >= 3) {
        setCooldown(10); // 10 seconds lock penalty
        setErrorMsg("Maximum sequential login attempts exceeded! Locker locked for 10 seconds.");
      } else {
        setErrorMsg(`Incorrect security PIN entered (${nextWrong}/3 failed attempts)`);
      }
    }
  };

  // Pre-filled WhatsApp trigger to request password/pin reset
  const handleWhatsAppReset = () => {
    const rawNum = adminMobile.replace(/[^0-9]/g, "");
    const targetAdminPhone = rawNum.length === 10 ? `91${rawNum}` : rawNum;
    const msgText = `Hi MD Photography!\n\nI have locked my application and forgot my secure AppLock PIN. 🔒\n\nPlease reset/send me the official portal AppLock Passcode to release the screen. Thank you!`;
    const openUrl = `https://wa.me/${targetAdminPhone}?text=${encodeURIComponent(msgText)}`;
    window.open(openUrl, "_blank");
  };

  return (
    <div className="fixed inset-0 z-[99999] bg-slate-950/95 backdrop-blur-2xl flex flex-col items-center justify-center text-white select-none overflow-hidden font-sans">
      {/* Absolute top grid security pattern overlay */}
      <div className="absolute inset-0 opacity-5 bg-[linear-gradient(rgba(212,175,55,0.05)_1.5px,transparent_1.5px),linear-gradient(90deg,rgba(212,175,55,0.05)_1.5px,transparent_1.5px)] bg-[length:24px_24px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="relative max-w-sm w-full mx-auto p-8 rounded-[2.5rem] bg-slate-900/60 border border-luxury-gold/20 flex flex-col items-center gap-6 shadow-[0_0_50px_rgba(212,175,55,0.08)] text-center relative z-20 m-4"
      >
        {/* Security Shield Lock Status Display */}
        <div className="relative">
          <div className="absolute -inset-1 rounded-full bg-luxury-gold/15 blur-lg animate-pulse" />
          <div className="relative bg-black border border-luxury-gold/50 h-16 w-16 rounded-full flex items-center justify-center shadow-lg">
            {cooldown > 0 ? (
              <Shield className="h-7 w-7 text-rose-500 animate-[spin_10s_linear_infinite]" />
            ) : (
              <Lock className="h-7 w-7 text-luxury-gold animate-pulse" />
            )}
          </div>
        </div>

        <div>
          <h2 className="text-sm font-black text-[#D4AF37] uppercase tracking-[0.25em] font-display">
            {cooldown > 0 ? "LOCKER FORCED SUSPEND" : "MD SECURE APPLOCK"}
          </h2>
          <p className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-widest mt-1">
            {cooldown > 0 ? `Keypad Cooldown Remaining` : "Security verification screen active"}
          </p>
        </div>

        {/* 4 Digit Interactive visual feedback bubbles */}
        <div className="flex justify-center gap-4 py-2 select-none">
          {Array.from({ length: 4 }).map((_, idx) => {
            const isFilled = idx < inputVal.length;
            return (
              <motion.div
                key={idx}
                animate={shake ? { x: [0, -10, 10, -10, 10, 0] } : {}}
                transition={{ duration: 0.4 }}
                className={`h-5 w-5 rounded-full border-2 transition-all ${
                  isFilled
                    ? "bg-luxury-gold border-luxury-gold shadow-[0_0_12px_rgba(212,175,55,0.8)]"
                    : "border-zinc-700 bg-zinc-900/50"
                }`}
              />
            );
          })}
        </div>

        {/* Error notification element */}
        <AnimatePresence mode="wait">
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="p-3 bg-rose-950/40 border border-rose-500/15 rounded-xl flex items-center gap-2 max-w-[270px] mx-auto text-rose-300 text-[10px] uppercase font-bold tracking-wider leading-relaxed"
            >
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
              <span>{errorMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cooldown feedback timer or secure dial-pad keys */}
        {cooldown > 0 ? (
          <div className="py-8 flex flex-col items-center justify-center gap-3 w-full">
            <span className="text-4xl font-mono font-black text-rose-500 tracking-wider">
              {cooldown}s
            </span>
            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
              Please wait until secure cooldown expires
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4 py-2 max-w-[240px] w-full select-none">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleNumberPress(num)}
                className="h-14 w-14 rounded-full bg-black/40 border border-zinc-800 hover:border-luxury-gold hover:text-luxury-gold cursor-pointer font-mono font-bold text-lg flex items-center justify-center transition-all active:scale-95"
              >
                {num}
              </button>
            ))}

            <button
              type="button"
              onClick={() => {
                setErrorMsg("");
                setInputVal("");
              }}
              className="h-14 w-14 rounded-full bg-rose-950/20 hover:bg-rose-900/30 text-rose-400 cursor-pointer font-extrabold text-[11px] uppercase tracking-wider flex items-center justify-center transition-all active:scale-95 border border-rose-900/10"
              title="Clear entry code buffer"
            >
              C
            </button>

            <button
              type="button"
              onClick={() => handleNumberPress("0")}
              className="h-14 w-14 rounded-full bg-black/40 border border-zinc-800 hover:border-luxury-gold hover:text-luxury-gold cursor-pointer font-mono font-bold text-lg flex items-center justify-center transition-all active:scale-95"
            >
              0
            </button>

            <button
              type="button"
              onClick={handleBackspace}
              className="h-14 w-14 rounded-full bg-[#1e272e]/40 border border-zinc-800 hover:border-[#D4AF37] cursor-pointer text-zinc-450 hover:text-luxury-gold text-xs flex items-center justify-center transition-all active:scale-95"
              title="Delete single digit"
            >
              ⌫
            </button>
          </div>
        )}

        {/* WhatsApp PIN recovery footer block */}
        <div className="pt-4 border-t border-zinc-800 w-full flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={handleWhatsAppReset}
            className="text-[10px] text-emerald-400 hover:text-emerald-300 font-extrabold uppercase tracking-widest flex items-center gap-1.5 cursor-pointer bg-transparent border-0"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Forgotten PIN? WhatsApp Reset Request
          </button>
          
          <div className="text-[9px] text-zinc-500 font-semibold font-mono tracking-wider">
            SYSTEM ENGINE ACCESS CODE LOCKER
          </div>
        </div>
      </motion.div>
    </div>
  );
}
