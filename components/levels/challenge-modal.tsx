"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Brain, CheckCircle, Clock, Trophy, HelpCircle } from "lucide-react"
import { useStore } from "@/lib/store"
import { useChallenges } from "@/lib/hooks/use-challenges"
import { ResourceChallenge } from "./challenges/resource-challenge"
import { SchedulingChallenge } from "./challenges/scheduling-challenge"
import { DeadlockChallenge } from "./challenges/deadlock-challenge"

type ChallengeModalProps = {
  isOpen: boolean
  onClose: () => void
  level: number
}

export function ChallengeModal({ isOpen, onClose, level }: ChallengeModalProps) {
  const { simulation, updateGameMetrics, addExperience } = useStore()
  const { challenges } = useChallenges()

  const [timeElapsed, setTimeElapsed] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)
  const [score, setScore] = useState(0)
  const [attempts, setAttempts] = useState(0)
  const [showHint, setShowHint] = useState(false)

  const challenge = challenges[level - 1]

  useEffect(() => {
    if (!isOpen || isCompleted) return

    // Start timer
    const timer = setInterval(() => {
      setTimeElapsed((prev) => prev + 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [isOpen, isCompleted])

  const handleSubmit = (isCorrect: boolean) => {
    setAttempts((prev) => prev + 1)

    if (isCorrect) {
      // Calculate score based on time and attempts
      const timeBonus = Math.max(0, 300 - timeElapsed)
      const attemptPenalty = attempts * 20
      const levelBonus = level * 50
      const calculatedScore = levelBonus + timeBonus - attemptPenalty

      setScore(Math.max(50, calculatedScore))
      setIsCompleted(true)

      // Update game metrics
      updateGameMetrics({
        levelsCompleted: Math.max(level, useStore.getState().gameMetrics.levelsCompleted),
      })

      // Add experience and update score
      addExperience(calculatedScore / 10)

      // Update the simulation score
      useStore.setState((state) => ({
        simulation: {
          ...state.simulation,
          score: state.simulation.score + calculatedScore,
        },
      }))
    }
  }

  const renderChallenge = () => {
    if (!challenge) return null

    switch (challenge.type) {
      case "resource":
        return <ResourceChallenge challenge={challenge} onSubmit={handleSubmit} />
      case "scheduling":
        return <SchedulingChallenge challenge={challenge} onSubmit={handleSubmit} />
      case "deadlock":
        return <DeadlockChallenge challenge={challenge} onSubmit={handleSubmit} />
      default:
        return <div>Challenge type not supported</div>
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-os-dark rounded-lg border border-os-light p-6 shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white flex items-center">
                <Brain className="mr-2 text-os-blue" />
                Level {level}: {challenge?.title || "Challenge"}
              </h2>
              <div className="flex items-center space-x-4">
                {!isCompleted && (
                  <div className="flex items-center text-gray-400">
                    <Clock className="mr-1 h-4 w-4" />
                    <span className="text-sm">{formatTime(timeElapsed)}</span>
                  </div>
                )}
                <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Challenge Description */}
            <div className="bg-os-darker rounded-md border border-os-light p-4 mb-6">
              <p className="text-gray-300">{challenge?.description}</p>
              {challenge?.hint && (
                <div className="mt-3">
                  <button
                    onClick={() => setShowHint(!showHint)}
                    className="flex items-center text-os-blue text-sm hover:underline"
                  >
                    <HelpCircle className="mr-1 h-4 w-4" />
                    {showHint ? "Hide Hint" : "Show Hint"}
                  </button>
                  {showHint && <p className="mt-2 text-os-yellow text-sm italic">{challenge.hint}</p>}
                </div>
              )}
            </div>

            {/* Challenge Content */}
            <div className="mb-6">{renderChallenge()}</div>

            {/* Completion State */}
            {isCompleted && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-green-900/30 border border-green-700 rounded-md p-4 flex items-center mb-4"
              >
                <CheckCircle className="text-os-green mr-3 h-6 w-6" />
                <div>
                  <h3 className="text-os-green font-bold">Challenge Completed!</h3>
                  <div className="flex items-center mt-1">
                    <Trophy className="text-os-yellow mr-2 h-5 w-5" />
                    <span className="text-os-yellow font-bold">{score} points earned</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Footer Actions */}
            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={onClose}
                className="bg-os-light text-white py-2 px-4 rounded-md hover:bg-os-lighter transition-colors"
              >
                {isCompleted ? "Continue" : "Exit Challenge"}
              </button>
              {isCompleted && level < challenges.length && (
                <button
                  onClick={() => {
                    onClose()
                    // Small delay to allow the modal to close before opening the next one
                    setTimeout(() => {
                      useStore.setState((state) => ({
                        gameMetrics: {
                          ...state.gameMetrics,
                          levelsCompleted: Math.max(level, state.gameMetrics.levelsCompleted),
                        },
                      }))
                    }, 300)
                  }}
                  className="bg-os-blue text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors"
                >
                  Next Level
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
