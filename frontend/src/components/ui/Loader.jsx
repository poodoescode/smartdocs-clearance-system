import React from 'react';
import { motion } from 'framer-motion';

const Loader = () => {
  const stackVariants = {
    animate: (index) => ({
      y: [0, -24, 0],
      scale: [1, 1.05, 1],
      rotate: [45, 45, 45],
      filter: [
        'brightness(1) blur(0px)',
        'brightness(1.2) blur(0px)',
        'brightness(1) blur(0px)'
      ],
      transition: {
        duration: 1.2,
        repeat: Infinity,
        ease: "easeInOut",
        delay: index * 0.08,
        times: [0, 0.5, 1]
      },
    }),
  };

  const shadowVariants = {
    animate: {
      scale: [1, 0.6, 1],
      opacity: [0.3, 0.1, 0.3],
      transition: {
        duration: 1.2,
        repeat: Infinity,
        ease: "easeInOut",
      },
    }
  };

  const gridVariants = {
    animate: {
      backgroundPosition: ["0% 0%", "100% 100%"],
      transition: {
        duration: 10,
        repeat: Infinity,
        ease: "linear"
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#021205] overflow-hidden perspective-[1000px]">
      
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary-900/30 via-[#021205] to-[#021205]" />
        
        <motion.div 
          variants={gridVariants}
          animate="animate"
          className="absolute inset-0 opacity-[0.15]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(34, 197, 94, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(34, 197, 94, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
            transform: 'perspective(500px) rotateX(60deg) translateY(100px) scale(2)',
            transformOrigin: 'bottom center'
          }}
        />
        
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-secondary-400/20 rounded-full blur-[1px] animate-pulse" />
        <div className="absolute bottom-1/3 right-1/4 w-1 h-1 bg-primary-400/30 rounded-full blur-[0.5px] animate-bounce" />
      </div>

      <div className="relative z-10 flex flex-col items-center">
        
        <div className="relative w-32 h-32 mb-10 flex items-center justify-center">
          
          <motion.div
            variants={shadowVariants}
            animate="animate"
            className="absolute bottom-[-10px] w-20 h-6 bg-black/60 blur-lg rounded-[100%]"
          />

          <motion.div
            custom={0}
            variants={stackVariants}
            animate="animate"
            className="absolute w-20 h-20 bg-gradient-to-br from-primary-900 to-primary-700 rounded-2xl shadow-xl border border-primary-500/10 z-10"
            style={{ top: '20px' }}
          />

          <motion.div
            custom={1}
            variants={stackVariants}
            animate="animate"
            className="absolute w-20 h-20 bg-gradient-to-br from-secondary-600 via-secondary-500 to-secondary-400 rounded-2xl shadow-[0_10px_30px_-10px_rgba(234,179,8,0.3)] border border-secondary-400/20 z-20 opacity-90 backdrop-blur-sm"
            style={{ top: '0px' }}
          />

          <motion.div
            custom={2}
            variants={stackVariants}
            animate="animate"
            className="absolute w-20 h-20 bg-gradient-to-br from-white/90 via-primary-50 to-white/40 rounded-2xl shadow-[0_0_40px_rgba(34,197,94,0.4)] border border-white/60 z-30 backdrop-blur-md"
            style={{ top: '-20px' }}
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent rounded-2xl opacity-50" />
            
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 border-[2px] border-primary-500/30 rounded-lg flex items-center justify-center">
               <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" />
            </div>
          </motion.div>

        </div>

        <div className="flex flex-col items-center space-y-3">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="relative"
          >
            <h1 className="text-4xl font-bold font-display tracking-tight">
              <span className="text-white drop-shadow-md">Smart</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-primary-200 drop-shadow-[0_0_15px_rgba(34,197,94,0.5)]">Clearance</span>
            </h1>
            
            <motion.div
              animate={{ x: ['-100%', '200%'] }}

              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", repeatDelay: 0.5 }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 pointer-events-none"
            />
          </motion.div>

          <div className="flex items-center gap-2">
            <span className="h-[2px] w-8 bg-gradient-to-r from-transparent to-primary-500/50" />
            <span className="text-xs uppercase tracking-[0.2em] text-primary-400/60 font-medium">
              Initializing System
            </span>
            <span className="h-[2px] w-8 bg-gradient-to-l from-transparent to-primary-500/50" />
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default Loader;