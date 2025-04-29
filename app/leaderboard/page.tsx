"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Home, Trophy, Medal, User, Search } from "lucide-react"
import { scoresAPI } from "@/lib/api/mock-api"
import { useAuth } from "@/lib/contexts/auth-context"

type LeaderboardEntry = {
  id: number
  name: string
  rollNumber: string
  score: number
  level: number
}

export default function LeaderboardPage() {
  const { user } = useAuth()
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterLevel, setFilterLevel] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch leaderboard data
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setIsLoading(true)
        const data = await scoresAPI.getLeaderboard(filterLevel || undefined)
        setLeaderboard(data)
      } catch (error) {
        console.error("Failed to fetch leaderboard:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchLeaderboard()
  }, [filterLevel])

  // Filter leaderboard based on search
  const filteredLeaderboard = leaderboard.filter((entry) => {
    return (
      entry.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.rollNumber.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  return (
    <main className="min-h-screen bg-os-darker flex flex-col">
      {/* Header */}
      <header className="bg-os-dark border-b border-os-light p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">
            <span className="text-os-blue">OS</span> Simulator Leaderboard
          </h1>
          <nav className="flex space-x-4">
            <Link href="/" className="text-white hover:text-os-blue transition-colors flex items-center">
              <Home className="mr-1" size={16} />
              Home
            </Link>
            <Link href="/simulation" className="text-white hover:text-os-blue transition-colors flex items-center">
              <Trophy className="mr-1" size={16} />
              Simulation
            </Link>
          </nav>
        </div>
      </header>

      {/* Leaderboard Content */}
      <div className="flex-1 container mx-auto p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-os-dark rounded-lg border border-os-light p-6 shadow-lg"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center">
              <Trophy className="mr-2 text-os-yellow" />
              Leaderboard
            </h2>

            {/* Search and Filter */}
            <div className="flex space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search by name or roll number"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-os-darker border border-os-light rounded-md py-2 pl-10 pr-4 text-white text-sm focus:outline-none focus:ring-1 focus:ring-os-blue"
                />
              </div>

              <select
                value={filterLevel || ""}
                onChange={(e) => setFilterLevel(e.target.value ? Number.parseInt(e.target.value) : null)}
                className="bg-os-darker border border-os-light rounded-md py-2 px-4 text-white text-sm focus:outline-none focus:ring-1 focus:ring-os-blue"
              >
                <option value="">All Levels</option>
                <option value="1">Level 1</option>
                <option value="2">Level 2</option>
                <option value="3">Level 3</option>
              </select>
            </div>
          </div>

          {/* User's Position */}
          {user && (
            <div className="mb-6 bg-os-blue/20 border border-os-blue rounded-md p-4">
              <h3 className="text-white font-medium mb-2">Your Position</h3>
              <div className="flex items-center">
                <div className="bg-os-blue/30 rounded-full h-10 w-10 flex items-center justify-center mr-3">
                  <User className="text-os-blue h-5 w-5" />
                </div>
                <div>
                  <p className="text-white font-medium">{user.name}</p>
                  <p className="text-sm text-gray-400">{user.rollNumber}</p>
                </div>
                <div className="ml-auto flex items-center">
                  <div className="bg-os-darker rounded-md px-3 py-1 mr-3">
                    <p className="text-xs text-gray-400">Rank</p>
                    <p className="text-white font-medium">
                      {leaderboard.findIndex((entry) => entry.name === user.name) + 1 || "-"}
                    </p>
                  </div>
                  <div className="bg-os-darker rounded-md px-3 py-1">
                    <p className="text-xs text-gray-400">Score</p>
                    <p className="text-os-yellow font-medium">
                      {leaderboard.find((entry) => entry.name === user.name)?.score || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-os-blue"></div>
            </div>
          ) : (
            /* Leaderboard Table */
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-os-light">
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-400">Rank</th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-400">Name</th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-400">Roll Number</th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-400">Level</th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-400">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeaderboard.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-gray-500">
                        No results found
                      </td>
                    </tr>
                  ) : (
                    filteredLeaderboard.map((entry, index) => (
                      <tr key={entry.id} className="border-b border-os-light hover:bg-os-lighter transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            {index < 3 ? (
                              <Medal
                                className={`mr-2 h-5 w-5 ${
                                  index === 0 ? "text-yellow-500" : index === 1 ? "text-gray-400" : "text-amber-700"
                                }`}
                              />
                            ) : (
                              <span className="text-gray-500 w-7 text-center">{index + 1}</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <User className="mr-2 h-4 w-4 text-os-blue" />
                            <span className="text-white">{entry.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-300">{entry.rollNumber}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              entry.level === 1
                                ? "bg-os-green/20 text-os-green"
                                : entry.level === 2
                                  ? "bg-os-blue/20 text-os-blue"
                                  : "bg-os-purple/20 text-os-purple"
                            }`}
                          >
                            Level {entry.level}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-os-yellow">{entry.score}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="bg-os-dark border-t border-os-light p-4 text-center text-gray-400">
        <p>© 2023 OS Resource Allocation Simulator | Educational Project</p>
      </footer>
    </main>
  )
}
