"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useStore } from "@/lib/store"
import { ChevronRight, ChevronDown, Trophy, Star, Award, TrendingUp } from "lucide-react"

export function UserProgressPanel() {
  const { simulation, gameMetrics } = useStore()
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-os-dark rounded-lg border border-os-light shadow-lg overflow-hidden"
    >
      <div className="p-4 flex items-center justify-between cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center">
          <Trophy className="mr-2 text-os-yellow" />
          <h2 className="text-xl font-bold text-white">User Progress</h2>
        </div>
        <div className="flex items-center">
          <span className="text-os-yellow font-mono mr-2">
            Level {simulation.level} • {simulation.experience} XP
          </span>
          {isExpanded ? <ChevronDown className="text-gray-400" /> : <ChevronRight className="text-gray-400" />}
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 pb-4"
          >
            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Level {simulation.level}</span>
                <span>Level {simulation.level + 1}</span>
              </div>
              <div className="w-full bg-os-light rounded-full h-2">
                <motion.div
                  className="bg-os-yellow h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${(simulation.experience % 500) / 5}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>

            {/* Levels Completed */}
            <div className="mb-4">
              <h3 className="text-sm font-bold text-gray-300 mb-2 flex items-center">
                <Star className="mr-2 h-4 w-4 text-os-blue" />
                Completed Levels
              </h3>

              <div className="bg-os-darker rounded-md p-3 border border-os-light">
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3].map((level) => {
                    const completed = gameMetrics.levelsCompleted >= level
                    const bestScore = gameMetrics.bestScores[level] || 0

                    return (
                      <div
                        key={level}
                        className={`rounded-md p-2 border ${completed ? "border-os-blue/50 bg-os-blue/10" : "border-os-light bg-os-darker"}`}
                      >
                        <div className="text-sm font-bold text-white mb-1 flex items-center justify-between">
                          <span>Level {level}</span>
                          {completed && <Award className="h-3 w-3 text-os-yellow" />}
                        </div>
                        <div className="text-xs text-gray-400 flex justify-between">
                          <span>Best Score:</span>
                          <span className="text-os-yellow">{bestScore}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="mb-4">
              <h3 className="text-sm font-bold text-gray-300 mb-2 flex items-center">
                <TrendingUp className="mr-2 h-4 w-4 text-os-green" />
                Performance Metrics
              </h3>

              <div className="bg-os-darker rounded-md p-3 border border-os-light">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col">
                    <div className="text-xs text-gray-400">Total Attempts</div>
                    <div className="text-lg font-bold text-white">{gameMetrics.attempts}</div>
                  </div>

                  <div className="flex flex-col">
                    <div className="text-xs text-gray-400">Current Score</div>
                    <div className="text-lg font-bold text-os-yellow">{simulation.score}</div>
                  </div>

                  <div className="flex flex-col">
                    <div className="text-xs text-gray-400">Deadlocks Avoided</div>
                    <div className="text-lg font-bold text-os-green">{gameMetrics.deadlocksAvoided}</div>
                  </div>

                  <div className="flex flex-col">
                    <div className="text-xs text-gray-400">Deadlocks Occurred</div>
                    <div className="text-lg font-bold text-os-red">{gameMetrics.deadlocksOccurred}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Algorithm Performance */}
            <div>
              <h3 className="text-sm font-bold text-gray-300 mb-2 flex items-center">
                <Star className="mr-2 h-4 w-4 text-os-purple" />
                Algorithm Efficiency
              </h3>

              <div className="bg-os-darker rounded-md p-3 border border-os-light">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Most Efficient Algorithm:</span>
                    <span className="text-white font-medium">
                      {gameMetrics.mostEfficientAlgorithm || "Not determined yet"}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Average CPU Utilization:</span>
                    <span className="text-white font-medium">{simulation.cpuUtilization.toFixed(1)}%</span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Average Waiting Time:</span>
                    <span className="text-white font-medium">{simulation.averageWaitingTime.toFixed(2)} units</span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Average Turnaround Time:</span>
                    <span className="text-white font-medium">{simulation.averageTurnaroundTime.toFixed(2)} units</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
