import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

const ThankYouPage: React.FC = () => {
  // Effect for confetti animation (optional)
  useEffect(() => {
    // Cleanup function
    return () => {
      // Any cleanup if needed
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-800 to-purple-900 relative overflow-hidden">
      {/* Top decorative elements */}
      <div className="absolute top-0 left-0 w-full flex justify-around">
        <img src="/images/lantern.png" alt="" className="h-36 w-auto" />
        <img src="/images/star.png" alt="" className="h-20 w-auto animate-pulse" />
        <img src="/images/lantern.png" alt="" className="h-36 w-auto" />
        <img src="/images/star.png" alt="" className="h-16 w-auto animate-pulse" />
        <img src="/images/lantern.png" alt="" className="h-36 w-auto" />
      </div>

      {/* Thank you message card */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 bg-blue-900 bg-opacity-50 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-yellow-400 border-opacity-50 max-w-md w-full mx-4"
      >
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <div className="text-center">
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
              }}
              transition={{ 
                duration: 1.5, 
                repeat: Infinity,
                repeatType: "reverse" 
              }}
              className="mx-auto mb-6 text-yellow-400 text-6xl"
            >
              ✓
            </motion.div>
            <h2 className="text-3xl font-bold text-yellow-400 mb-4">Terima Kasih!</h2>
            <p className="text-yellow-200 mb-6">Suara Anda telah berhasil direkam.</p>
            
            {/* Star rating display (optional) */}
            <div className="flex justify-center text-2xl text-yellow-400 mb-6">
              {'★★★★★'.split('').map((star, i) => (
                <motion.span 
                  key={i}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.5 + (i * 0.1), duration: 0.5 }}
                >
                  {star}
                </motion.span>
              ))}
            </div>
            
            <motion.a 
              href="/"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              className="inline-block px-6 py-3 rounded-full bg-yellow-500 text-blue-900 font-semibold hover:bg-yellow-400 transition duration-300"
            >
              Kembali ke Beranda
            </motion.a>
          </div>
        </motion.div>
      </motion.div>
      
      {/* Floating stars animation */}
      <div className="stars absolute inset-0 z-0 overflow-hidden">
        {Array.from({ length: 20 }).map((_, i) => (
          <div 
            key={i}
            className="absolute bg-yellow-300 rounded-full"
            style={{
              width: Math.random() * 3 + 1 + 'px',
              height: Math.random() * 3 + 1 + 'px',
              top: Math.random() * 100 + '%',
              left: Math.random() * 100 + '%',
              opacity: Math.random() * 0.5 + 0.3,
              animation: `twinkle ${Math.random() * 5 + 2}s infinite`
            }}
          />
        ))}
      </div>
      
      {/* Bottom decorative elements */}
      <div className="absolute bottom-0 w-full">
        <img src="/images/food-platter.png" alt="" className="w-full max-h-56 object-contain" />
      </div>
      
      {/* Corner decorations */}
      <div className="absolute bottom-0 left-0">
        <img src="/images/corner-left.png" alt="" className="h-40 w-auto" />
      </div>
      <div className="absolute bottom-0 right-0">
        <img src="/images/corner-right.png" alt="" className="h-40 w-auto" />
      </div>
      
      {/* Company branding at bottom */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
        <div className="bg-blue-900 bg-opacity-70 px-4 py-2 rounded-full text-xs text-yellow-200">
          Werkudara Group | werkudara.com
        </div>
      </div>
    </div>
  );
};

export default ThankYouPage;