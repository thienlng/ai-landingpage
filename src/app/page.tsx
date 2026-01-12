'use client'

import Scene3D from '@/components/Scene3D'
import { motion } from 'framer-motion'

export default function Home() {
  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-[#050505] text-white">
      {/* 3D Background */}
      <Scene3D />

      {/* Content Overlay */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6">
        <nav className="absolute top-0 flex w-full items-center justify-between p-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-2xl font-bold tracking-tighter"
          >
            NEURAL<span className="text-indigo-500">LABS</span>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="hidden space-x-8 text-sm font-medium text-zinc-400 sm:flex"
          >
            <a href="#" className="transition-colors hover:text-white">Vision</a>
            <a href="#" className="transition-colors hover:text-white">Technology</a>
            <a href="#" className="transition-colors hover:text-white">Ecosystem</a>
          </motion.div>
        </nav>

        <div className="max-w-4xl text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6 text-6xl font-extrabold tracking-tight sm:text-8xl"
          >
            The Future of <br />
            <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Spatial Intelligence
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mx-auto mb-10 max-w-2xl text-lg text-zinc-400 sm:text-xl"
          >
            Harnessing the power of decentralized 3D computing to build the next generation of digital experiences.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <button className="rounded-full bg-white px-8 py-4 font-semibold text-black transition-transform hover:scale-105 active:scale-95">
              Get Started
            </button>
            <button className="rounded-full border border-zinc-800 bg-white/5 px-8 py-4 font-semibold backdrop-blur-xl transition-all hover:bg-white/10">
              View Documentation
            </button>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-10 flex flex-col items-center gap-2 text-zinc-500"
        >
          <span className="text-xs uppercase tracking-widest">Scroll to explore</span>
          <div className="h-12 w-px bg-gradient-to-b from-indigo-500 to-transparent"></div>
        </motion.div>
      </div>
    </main>
  )
}
