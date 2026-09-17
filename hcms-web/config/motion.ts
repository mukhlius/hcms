import { Variants } from 'framer-motion';

export const motionTokens = {
  duration: {
    instant: 0.1,
    fast: 0.15,
    normal: 0.2,
    moderate: 0.3,
    slow: 0.4,
  },
  ease: {
    out: [0.16, 1, 0.3, 1] as [number, number, number, number],
    inOut: [0.4, 0, 0.2, 1] as [number, number, number, number],
  },
  distance: {
    xs: 2,
    sm: 4,
    md: 8,
    lg: 16,
  },
};

export const pageTransitionVariants: Variants = {
  initial: { opacity: 0, y: 6 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: motionTokens.duration.normal,
      ease: motionTokens.ease.out 
    }
  },
  exit: { 
    opacity: 0, 
    y: -4,
    transition: { 
      duration: motionTokens.duration.fast,
      ease: motionTokens.ease.inOut 
    }
  },
};

export const fadeInVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1, 
    transition: { duration: motionTokens.duration.normal, ease: motionTokens.ease.out } 
  },
};

export const fadeInUpVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: motionTokens.duration.moderate, ease: motionTokens.ease.out } 
  },
};

export const scaleInVariants: Variants = {
  hidden: { opacity: 0, scale: 0.97 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    transition: { duration: motionTokens.duration.normal, ease: motionTokens.ease.out } 
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    transition: { duration: motionTokens.duration.fast, ease: motionTokens.ease.inOut }
  }
};
