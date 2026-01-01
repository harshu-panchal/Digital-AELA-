import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoCloudUploadOutline, IoCheckmarkCircle, IoAlertCircle } from 'react-icons/io5';

/**
 * Premium Upload Progress Component
 * Features:
 * - Glassmorphism effect
 * - Smooth framer-motion animations
 * - Dynamic status icons
 * - Progress bar with gradient
 */
const UploadProgress = ({ isUploading, progress, fileName, error }) => {
    if (!isUploading && !error && progress !== 100) return null;

    return (
        <AnimatePresence>
            {(isUploading || error || progress === 100) && (
                <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                    className="fixed bottom-6 right-6 z-[9999] w-80 overflow-hidden rounded-2xl border border-white/20 bg-white/10 p-4 shadow-2xl backdrop-blur-xl"
                >
                    <div className="flex items-center gap-3 mb-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${error ? 'bg-red-500/20 text-red-400' :
                                progress === 100 ? 'bg-green-500/20 text-green-400' :
                                    'bg-blue-500/20 text-blue-400'
                            }`}>
                            {error ? <IoAlertCircle size={24} /> :
                                progress === 100 ? <IoCheckmarkCircle size={24} /> :
                                    <IoCloudUploadOutline className="animate-bounce" size={24} />}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <h4 className="truncate text-sm font-semibold text-white">
                                {error ? 'Upload Failed' : progress === 100 ? 'Upload Complete' : 'Uploading...'}
                            </h4>
                            <p className="truncate text-xs text-white/60">{fileName || 'File'}</p>
                        </div>
                        <span className="text-xs font-bold text-white/80">{Math.round(progress)}%</span>
                    </div>

                    <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/10">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ type: "spring", damping: 20, stiffness: 100 }}
                            className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ${error ? 'from-red-500 to-rose-400' :
                                    progress === 100 ? 'from-green-500 to-emerald-400' :
                                        'from-blue-500 to-indigo-400'
                                }`}
                        />
                    </div>

                    {error && (
                        <p className="mt-2 text-[10px] text-red-400 font-medium">
                            {error}
                        </p>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default UploadProgress;
