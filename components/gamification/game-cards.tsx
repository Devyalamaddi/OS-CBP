"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { Gamepad2, Terminal, Puzzle, Clock } from "lucide-react"

type GameParticipantsModalProps = {
  isOpen: boolean
  onClose: () => void
  onSubmit: (participants: number) => void
  gameName: string
}

function GameParticipantsModal({ isOpen, onClose, onSubmit, gameName }: GameParticipantsModalProps) {
  const [participants, setParticipants] = useState(2)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-os-dark rounded-lg border border-os-light p-6 shadow-xl w-full max-w-md"
      >
        <h2 className="text-xl font-bold text-white mb-4">{gameName} - Enter Number of Participants</h2>

        <div className="mb-6">
          <label htmlFor="participants" className="block text-sm font-medium text-gray-400 mb-2">
            Number of Participants
          </label>
          <div className="flex items-center">
            <input
              type="range"
              id="participants"
              min="1"
              max="6"
              value={participants}
              onChange={(e) => setParticipants(Number(e.target.value))}
              className="w-full h-2 bg-os-light rounded-lg appearance-none cursor-pointer"
            />
            <span className="ml-4 text-white font-bold text-lg">{participants}</span>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="bg-os-light text-white py-2 px-4 rounded-md hover:bg-os-lighter transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onSubmit(participants)}
            className="bg-os-blue text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors"
          >
            Start Game
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export function GameCards() {
  const router = useRouter()
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedGame, setSelectedGame] = useState<string>("")

  const handlePlayNow = (gameName: string) => {
    setSelectedGame(gameName)
    setModalOpen(true)
  }

  const handleSubmitParticipants = (participants: number) => {
    setModalOpen(false)

    // Store participants count in localStorage for the game to use
    localStorage.setItem(`${selectedGame}-participants`, participants.toString())

    // Navigate to the game page
    router.push(`/${selectedGame.toLowerCase().replace(/\s+/g, "-")}`)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-os-dark rounded-lg border border-os-light p-4 shadow-lg"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white flex items-center">
          <Gamepad2 className="mr-2 text-os-blue" />
          Gamify OS: Play. Learn. Conquer.
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {/* System Commander Card */}
        {/* <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-gradient-to-br from-os-blue/20 to-os-blue/5 border border-os-blue/30 rounded-lg p-4 shadow-md"
        >
          <div className="flex items-center mb-2">
            <Terminal className="text-os-blue mr-2" />
            <h3 className="text-lg font-bold text-white">System Commander</h3>
          </div>
          <p className="text-gray-300 text-sm mb-4">
            Step into the role of an OS kernel! Take control of a virtual computer system, allocate limited resources,
            manage multiple processes, and respond to dynamic challenges without triggering a deadlock. As you progress
            through levels, system complexity increases—testing your decision-making skills in real-time.
          </p>
          <button
            onClick={() => handlePlayNow("System Commander")}
            className="bg-os-blue hover:bg-blue-600 text-white py-2 px-4 rounded-md transition-colors w-full flex items-center justify-center"
          >
            <span>Play Now</span>
          </button>
        </motion.div> */}

        {/* Hack the OS Card */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-gradient-to-br from-os-purple/20 to-os-purple/5 border border-os-purple/30 rounded-lg p-4 shadow-md"
        >
          <div className="flex items-center mb-2">
            <Puzzle className="text-os-purple mr-2" />
            <h3 className="text-lg font-bold text-white">Hack the OS</h3>
          </div>
          <p className="text-gray-300 text-sm mb-4">
            A puzzle-based game inspired by the Banker's algorithm. You'll face matrix-based deadlock puzzles that
            require smart decisions to bring the system to a safe state. Reorder processes, analyze resource requests,
            and simulate outcomes to prevent catastrophe. Ideal for players who enjoy logical reasoning and step-by-step
            deduction.
          </p>
          <button
            onClick={() => handlePlayNow("Hack the OS")}
            className="bg-os-purple hover:bg-purple-600 text-white py-2 px-4 rounded-md transition-colors w-full flex items-center justify-center"
          >
            <span>Play Now</span>
          </button>
        </motion.div>

        {/* Scheduler Showdown Card */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-gradient-to-br from-os-green/20 to-os-green/5 border border-os-green/30 rounded-lg p-4 shadow-md"
        >
          <div className="flex items-center mb-2">
            <Clock className="text-os-green mr-2" />
            <h3 className="text-lg font-bold text-white">Scheduler Showdown</h3>
          </div>
          <p className="text-gray-300 text-sm mb-4">
            Compete against the clock or simulated opponents by choosing the best CPU scheduling algorithm (FCFS, SJF,
            Priority, RR). Input participant details, define process characteristics, and deploy your scheduling
            strategy. After evaluation, see rankings and performance metrics to improve your skills.
          </p>
          <button
            onClick={() => handlePlayNow("Scheduler Showdown")}
            className="bg-os-green hover:bg-green-600 text-white py-2 px-4 rounded-md transition-colors w-full flex items-center justify-center"
          >
            <span>Play Now</span>
          </button>
        </motion.div>
      </div>

      {/* Participants Modal */}
      <GameParticipantsModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmitParticipants}
        gameName={selectedGame}
      />
    </motion.div>
  )
}
