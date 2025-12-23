//src/hooks/useModal.jsx
import { useState, useEffect } from "react";

export function useModal({ isOpen, animationDuration = 400, escToClose = true, onClose = () => {} }) {
  const [shouldRender, setShouldRender] = useState(false);
  const [animateClass, setAnimateClass] = useState("translate-x-full");

  // Lock scroll when modal opens
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      document.body.style.overflow = "hidden";
      setTimeout(() => setAnimateClass("translate-x-0"), 10);
    } else {
      setAnimateClass("translate-x-full");
      const timeout = setTimeout(() => {
        setShouldRender(false);
        document.body.style.overflow = ""; // unlock scroll
      }, animationDuration);
      return () => clearTimeout(timeout);
    }
  }, [isOpen, animationDuration]);

  // Close on ESC key
  useEffect(() => {
    if (!escToClose || !isOpen) return;
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [escToClose, isOpen, onClose]);

  return { shouldRender, animateClass };
}
