"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { useStore } from "@/lib/store"
import { Brain, ChevronRight, Star, Trophy, Lock } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ChallengeModal } from "./challenge-modal"
import { useChallenges } from "@/lib/hooks/use-challenges"

export function LevelsPanel() {
  const { simulation, gameMetrics } = useStore()
  const { challenges } = useChallenges()

  const [selectedLevel, setSelectedLevel] = useState<number | null>(null)
  const [isChallengeModalOpen, setChallengeModalOpen] = useState(false)

  const handleLevelSelect = (level: number) => {
    // Check if level is unlocked
    if (level > gameMetrics.levelsCompleted + 1) {
      return // Level is locked
    }

    setSelectedLevel(level)
    setChallengeModalOpen(true)
  }

  const handleCloseChallenge = () => {
    setChallengeModalOpen(false)
    setSelectedLevel(null)
  }

  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-os-dark rounded-lg border border-os-light p-4 shadow-lg"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center">
            <Brain className="mr-2 text-os-blue" />
            Challenge Levels
          </h2>
          <div className="flex items-center">
            <Trophy className="mr-2 text-os-yellow" />
            <span className="text-os-yellow font-mono">Score: {simulation.score}</span>
          </div>
        </div>

        {/* Level Selection */}
        <div className="grid grid-cols-5 gap-2 mb-4">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((level) => {
            const isUnlocked = level <= gameMetrics.levelsCompleted + 1
            const isCompleted = level <= gameMetrics.levelsCompleted
            const bestScore = gameMetrics.bestScores[level] || 0

            return (
              <Tooltip key={level}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => handleLevelSelect(level)}
                    className={`relative h-16 rounded-md flex flex-col items-center justify-center ${
                      isUnlocked
                        ? isCompleted
                          ? "bg-os-green/20 border border-os-green hover:bg-os-green/30"
                          : "bg-os-blue/20 border border-os-blue hover:bg-os-blue/30"
                        : "bg-os-darker border border-os-light opacity-70 cursor-not-allowed"
                    }`}
                    disabled={!isUnlocked}
                  >
                    <span className={`text-lg font-bold ${isCompleted ? "text-os-green" : "text-white"}`}>
                      L{level}
                    </span>
                    {isCompleted && (
                      <div className="absolute -top-2 -right-2">
                        <Star className="h-4 w-4 text-os-yellow fill-os-yellow" />
                      </div>
                    )}
                    {!isUnlocked && (
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                    )}
                    {bestScore > 0 && <span className="text-xs text-os-yellow mt-1">{bestScore} pts</span>}
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  {isUnlocked ? (
                    <div>
                      <p className="font-bold">{challenges[level - 1]?.title || `Level ${level}`}</p>
                      <p className="text-xs text-gray-400">{isCompleted ? "Completed" : "Unlocked"}</p>
                      {bestScore > 0 && <p className="text-xs">Best Score: {bestScore}</p>}
                    </div>
                  ) : (
                    <p>Complete previous levels to unlock</p>
                  )}
                </TooltipContent>
              </Tooltip>
            )
          })}
        </div>

        {/* Level Description */}
        <div className="bg-os-darker rounded-md border border-os-light p-3">
          <h3 className="text-sm font-bold text-gray-300 mb-2 flex items-center">
            <ChevronRight className="mr-2 h-4 w-4 text-os-blue" />
            How to Play
          </h3>
          <p className="text-xs text-gray-300 mb-2">
            Select a level to start a challenge. Each level presents a unique problem related to:
          </p>
          <ul className="text-xs text-gray-300 space-y-1 list-disc pl-5 mb-2">
            <li>Process scheduling algorithms</li>
            <li>Resource allocation and deadlock avoidance</li>
            <li>Memory management techniques</li>
          </ul>
          <p className="text-xs text-gray-300">
            Complete challenges to earn points and unlock higher levels. Your score is based on correct solutions, time
            taken, and efficiency of your approach.
          </p>
        </div>

        {/* Challenge Modal */}
        {selectedLevel !== null && (
          <ChallengeModal isOpen={isChallengeModalOpen} onClose={handleCloseChallenge} level={selectedLevel} />
        )}
      </motion.div>
    </TooltipProvider>
  )
}
