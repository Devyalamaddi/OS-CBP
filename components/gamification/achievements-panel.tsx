"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useStore } from "@/lib/store"
import { Award, ChevronRight, ChevronDown, Trophy, Star, XCircle } from "lucide-react"

export function AchievementsPanel() {
  const { simulation } = useStore()
  const [isExpanded, setIsExpanded] = useState(false)

  const unlockedAchievements = simulation.achievements.filter((a) => a.unlocked)
  const lockedAchievements = simulation.achievements.filter((a) => !a.unlocked)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-os-dark rounded-lg border border-os-light shadow-lg overflow-hidden"
    >
      <div className="p-4 flex items-center justify-between cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center">
          <Trophy className="mr-2 text-os-yellow" />
          <h2 className="text-xl font-bold text-white">Achievements & Progress</h2>
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

            {/* Unlocked Achievements */}
            {unlockedAchievements.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-bold text-gray-300 mb-2 flex items-center">
                  <Award className="mr-2 h-4 w-4 text-os-green" />
                  Unlocked Achievements
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {unlockedAchievements.map((achievement) => (
                    <div
                      key={achievement.id}
                      className="bg-os-darker rounded-md p-2 border border-os-green/30 flex items-center"
                    >
                      <div className="text-2xl mr-2">{achievement.icon}</div>
                      <div>
                        <div className="text-sm font-bold text-white">{achievement.name}</div>
                        <div className="text-xs text-gray-400">{achievement.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Locked Achievements */}
            {lockedAchievements.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-gray-300 mb-2 flex items-center">
                  <Star className="mr-2 h-4 w-4 text-os-blue" />
                  Achievements to Unlock
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {lockedAchievements.map((achievement) => (
                    <div
                      key={achievement.id}
                      className="bg-os-darker rounded-md p-2 border border-os-light flex items-center"
                    >
                      <div className="text-2xl mr-2 opacity-50">{achievement.icon}</div>
                      <div className="flex-1">
                        <div className="text-sm font-bold text-white">{achievement.name}</div>
                        <div className="text-xs text-gray-400">{achievement.description}</div>
                        <div className="w-full bg-os-light rounded-full h-1 mt-1">
                          <motion.div
                            className="bg-os-blue h-1 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${(achievement.progress / achievement.target) * 100}%` }}
                            transition={{ duration: 0.5 }}
                          />
                        </div>
                      </div>
                      <div className="text-xs text-gray-400 ml-2">
                        {achievement.progress}/{achievement.target}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Daily Challenges */}
            <div className="mt-4">
              <h3 className="text-sm font-bold text-gray-300 mb-2 flex items-center">
                <XCircle className="mr-2 h-4 w-4 text-os-purple" />
                Daily Challenges
              </h3>

              <div className="bg-os-darker rounded-md p-3 border border-os-light">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <div className="text-sm font-bold text-white">Efficiency Challenge</div>
                    <div className="text-xs text-gray-400">Achieve 80% CPU utilization for 30 seconds</div>
                  </div>
                  <div className="text-xs text-os-yellow">+100 XP</div>
                </div>

                <div className="flex justify-between items-center mb-2">
                  <div>
                    <div className="text-sm font-bold text-white">Scheduling Master</div>
                    <div className="text-xs text-gray-400">Complete 5 processes using Round Robin</div>
                  </div>
                  <div className="text-xs text-os-yellow">+75 XP</div>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm font-bold text-white">Resource Manager</div>
                    <div className="text-xs text-gray-400">Allocate and release 10 resources without deadlock</div>
                  </div>
                  <div className="text-xs text-os-yellow">+150 XP</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
