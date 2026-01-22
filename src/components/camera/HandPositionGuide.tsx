import { motion } from "framer-motion";

interface HandPositionGuideProps {
  handDetected: boolean;
}

export const HandPositionGuide = ({ handDetected }: HandPositionGuideProps) => {
  if (handDetected) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 pointer-events-none flex items-center justify-center"
    >
      {/* Suggested hand zone guide - 60% of frame */}
      <div className="relative w-[60%] aspect-square max-w-[280px]">
        {/* Corner brackets */}
        <div className="absolute top-0 left-0 w-6 h-6 border-l-2 border-t-2 border-primary/40 rounded-tl-lg" />
        <div className="absolute top-0 right-0 w-6 h-6 border-r-2 border-t-2 border-primary/40 rounded-tr-lg" />
        <div className="absolute bottom-0 left-0 w-6 h-6 border-l-2 border-b-2 border-primary/40 rounded-bl-lg" />
        <div className="absolute bottom-0 right-0 w-6 h-6 border-r-2 border-b-2 border-primary/40 rounded-br-lg" />
        
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-center"
          >
            <div className="w-12 h-12 mx-auto mb-2 rounded-full border-2 border-dashed border-primary/30 flex items-center justify-center">
              <span className="text-2xl">✋</span>
            </div>
            <p className="text-xs text-primary/60 font-medium">
              Position hands here
            </p>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};
