'use client';

import React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

interface AnimatedCollapseProps {
  isOpen: boolean;
  children: React.ReactNode;
  className?: string;
}

export const AnimatedCollapse: React.FC<AnimatedCollapseProps> = ({ isOpen, children, className = '' }) => {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return isOpen ? <div className={className}>{children}</div> : null;
  }

  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          key="collapse-content"
          initial={{ height: 0, opacity: 0 }}
          animate={{ 
            height: 'auto', 
            opacity: 1,
            transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] }
          }}
          exit={{ 
            height: 0, 
            opacity: 0,
            transition: { duration: 0.15, ease: [0.4, 0, 0.2, 1] }
          }}
          className={`overflow-hidden ${className}`}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
