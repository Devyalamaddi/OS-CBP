"use client"

import Link from "next/link"
import { motion } from "framer-motion"

export default function Home() {
  return (
    <main className="min-h-screen bg-os-darker flex flex-col">
      {/* Header */}
      <header className="bg-os-dark border-b border-os-light p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">
            <span className="text-os-blue">OS</span> Resource Allocation Simulator
          </h1>
          <nav className="flex space-x-4">
            <Link href="/simulation" className="text-white hover:text-os-blue transition-colors">
              Simulation
            </Link>
            <Link href="/leaderboard" className="text-white hover:text-os-blue transition-colors">
              Leaderboard
            </Link>
            <Link href="/login" className="text-white hover:text-os-blue transition-colors">
              Login
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">
            Learn <span className="text-os-blue">Operating Systems</span> Through Interactive Simulation
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Master core OS concepts like Process Management, Deadlocks, and Synchronization through hands-on gameplay.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-os-dark p-6 rounded-lg border border-os-light">
              <h3 className="text-xl font-bold text-os-green mb-2">Process Lifecycle</h3>
              <p className="text-gray-400">
                Visualize and control the complete process lifecycle from creation to termination.
              </p>
            </div>
            <div className="bg-os-dark p-6 rounded-lg border border-os-light">
              <h3 className="text-xl font-bold text-os-purple mb-2">CPU Scheduling</h3>
              <p className="text-gray-400">
                Experiment with different scheduling algorithms and observe their effects.
              </p>
            </div>
            <div className="bg-os-dark p-6 rounded-lg border border-os-light">
              <h3 className="text-xl font-bold text-os-red mb-2">Deadlock Management</h3>
              <p className="text-gray-400">Create, detect, and resolve deadlocks in resource allocation scenarios.</p>
            </div>
          </div>
          <Link
            href="/simulation"
            className="inline-block bg-os-blue hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-md transition-colors text-lg"
          >
            Start Simulation
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="bg-os-dark border-t border-os-light p-4 text-center text-gray-400">
        <p>© 2025 OS Resource Allocation Simulator | Educational Project</p>
      </footer>
    </main>
  )
}
