'use client'

import Scene3D from '@/components/Scene3D'
import { motion } from 'framer-motion'

export default function Home() {
  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-[var(--netmind-dark)] text-white">
      {/* 3D Background */}
      <Scene3D />

      {/* Scanlines Overlay - Fixed via CSS class */}
      <div className="scanlines fixed inset-0 z-20 pointer-events-none opacity-50"></div>

      {/* Content Overlay */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 pointer-events-none pt-32">

        {/* <div className="text-center pointer-events-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="mb-2"
          >
            <h2 className="text-sm md:text-md uppercase tracking-[0.3em] text-[#FF3344] font-medium text-glow-subtle">The Brain of Viettel's Network</h2>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="text-7xl font-bold tracking-tighter sm:text-9xl mb-4"
            style={{ fontFamily: "'Orbitron', sans-serif" }}
          >
            <span className="text-[#E60012] text-glow">Net</span><span className="text-white text-glow">Mind</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="max-w-xl mx-auto text-zinc-400 text-lg sm:text-xl font-light leading-relaxed"
          >
            Operating, managing, and optimizing the entire telecom universe.
          </motion.p>
        </div> */}

        {/* Floating details or navigation could go here, but kept minimal as requested */}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-auto"
        >
          <div className="w-[1px] h-16 bg-gradient-to-b from-transparent via-white/20 to-transparent"></div>
          {/* <span className="text-[10px] uppercase tracking-widest text-white/30">Explore the Ecosystem</span> */}
        </motion.div>
      </div>
    </main>
  )
}
