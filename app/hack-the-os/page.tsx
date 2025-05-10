"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import {
  Home,
  ArrowLeft,
  Puzzle,
  LightbulbIcon,
  Lock,
  Unlock,
  CheckCircle,
  XCircle,
  HelpCircle,
  RotateCcw,
  Pause,
  Play,
  AlertTriangle,
  MoveLeft,
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// Types
type Process = {
  id: string
  name: string
  allocation: Record<string, number>
  max: Record<string, number>
  need: Record<string, number>
  finished: boolean
}

type Resource = {
  id: string
  name: string
  total: number
  available: number
}

type Level = {
  id: number
  name: string
  description: string
  difficulty: "Easy" | "Medium" | "Hard" | "Expert"
  color: string
  processes: number
  resources: number
  timeLimit: number
  minMoves: number
}

export default function HackTheOSPage() {
  const [participants, setParticipants] = useState<number>(2)
  const [currentLevel, setCurrentLevel] = useState<number>(1)
  const [isLoading, setIsLoading] = useState(true)
  const [gameStarted, setGameStarted] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [gameWon, setGameWon] = useState(false)
  const [score, setScore] = useState(0)
  const [time, setTime] = useState(0)
  const [moves, setMoves] = useState(0)
  const [hintsUsed, setHintsUsed] = useState(0)
  const [hintsAvailable, setHintsAvailable] = useState(3)
  const [processes, setProcesses] = useState<Process[]>([])
  const [resources, setResources] = useState<Resource[]>([])
  const [safeSequence, setSafeSequence] = useState<string[]>([])
  const [selectedProcess, setSelectedProcess] = useState<string | null>(null)
  const [showHint, setShowHint] = useState(false)
  const [showTutorial, setShowTutorial] = useState(true)
  const [paused, setPaused] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showModel, setShowModel] = useState<boolean>(true)

  const gameLoopRef = useRef<number | null>(null)

  // Level configurations
  const levels: Level[] = [
    {
      id: 1,
      name: "Safe Escape",
      description: "Simple 3-process scenario. One solution path.",
      difficulty: "Easy",
      color: "os-green",
      processes: 3,
      resources: 2,
      timeLimit: 120, // seconds
      minMoves: 3,
    },
    {
      id: 2,
      name: "Double Trouble",
      description: "Two possible solutions. Choose the most optimal path.",
      difficulty: "Medium",
      color: "os-blue",
      processes: 4,
      resources: 2,
      timeLimit: 180,
      minMoves: 4,
    },
    {
      id: 3,
      name: "Hidden Trap",
      description: "System looks safe, but one process causes circular wait. Identify it.",
      difficulty: "Medium",
      color: "os-yellow",
      processes: 4,
      resources: 3,
      timeLimit: 240,
      minMoves: 4,
    },
    {
      id: 4,
      name: "Chain Reaction",
      description: "Resource release order impacts future allocations. Chain simulate decisions.",
      difficulty: "Hard",
      color: "os-purple",
      processes: 5,
      resources: 3,
      timeLimit: 300,
      minMoves: 5,
    },
    {
      id: 5,
      name: "Minimal Moves",
      description: "Solve the puzzle in the least number of steps. Earn a 'Pro Hacker' badge.",
      difficulty: "Expert",
      color: "os-red",
      processes: 5,
      resources: 4,
      timeLimit: 360,
      minMoves: 5,
    },
  ]

  // Resource types
  const resourceTypes = ["A", "B", "C", "D"]

  useEffect(() => {
    // Get participants from localStorage
    const storedParticipants = localStorage.getItem("Hack the OS-participants")
    if (storedParticipants) {
      setParticipants(Number.parseInt(storedParticipants))
    }

    setIsLoading(false)
  }, [])

  // Initialize game
  const initializeGame = () => {
    try {
      const level = levels[currentLevel - 1]

      // Create resources
      const newResources: Resource[] = []
      for (let i = 0; i < level.resources; i++) {
        newResources.push({
          id: `r-${i}`,
          name: resourceTypes[i],
          total: Math.floor(Math.random() * 5) + 5,
          available: 0, // Will be calculated after process allocation
        })
      }

      // Create processes
      const newProcesses: Process[] = []
      for (let i = 0; i < level.processes; i++) {
        const allocation: Record<string, number> = {}
        const max: Record<string, number> = {}

        // Generate random allocation and max for each resource
        newResources.forEach((resource) => {
          const maxVal = Math.floor(Math.random() * (resource.total - 1)) + 1
          max[resource.id] = maxVal

          const allocVal = Math.floor(Math.random() * maxVal)
          allocation[resource.id] = allocVal
        })

        // Calculate need
        const need: Record<string, number> = {}
        newResources.forEach((resource) => {
          need[resource.id] = max[resource.id] - allocation[resource.id]
        })

        newProcesses.push({
          id: `p-${i}`,
          name: `P${i}`,
          allocation,
          max,
          need,
          finished: false,
        })
      }

      // Calculate available resources
      newResources.forEach((resource) => {
        const allocated = newProcesses.reduce((sum, process) => sum + (process.allocation[resource.id] || 0), 0)
        resource.available = resource.total - allocated
      })

      // Ensure the initial state is not safe (has a deadlock)
      // This makes the puzzle challenging
      let isSafe = checkSafeState(newProcesses, newResources)

      // If the state is already safe, make it unsafe by adjusting allocations
      if (isSafe && level.id > 1) {
        // Make one process request more than available
        const process = newProcesses[0]
        const resource = newResources[0]

        process.need[resource.id] = resource.available + 1
        process.max[resource.id] = process.allocation[resource.id] + process.need[resource.id]

        // Recheck
        isSafe = checkSafeState(newProcesses, newResources)
      }

      setProcesses(newProcesses)
      setResources(newResources)
      setSafeSequence([])
      setScore(0)
      setTime(0)
      setMoves(0)
      setHintsUsed(0)
      setHintsAvailable(3)
      setGameStarted(true)
      setGameOver(false)
      setGameWon(false)
      setPaused(false)
      setShowTutorial(true)
      setError(null)
    } catch (err) {
      setError("Failed to initialize game. Please try again.")
      console.error("Game initialization error:", err)
    }
  }

  // Game loop
  useEffect(() => {
    if (!gameStarted || paused || gameOver || gameWon) return

    const level = levels[currentLevel - 1]

    const gameLoop = () => {
      // Update time
      setTime((prev) => {
        const newTime = prev + 0.1

        // Check if time limit reached
        if (newTime >= level.timeLimit) {
          setGameOver(true)
          return prev
        }

        return newTime
      })

      gameLoopRef.current = requestAnimationFrame(gameLoop)
    }

    gameLoopRef.current = requestAnimationFrame(gameLoop)

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current)
      }
    }
  }, [gameStarted, paused, gameOver, gameWon, currentLevel])

  // Check if the current state is safe
  const checkSafeState = (procs: Process[], res: Resource[]): boolean => {
    try {
      // Implementation of Banker's Algorithm

      // Make copies to avoid modifying the original state
      const processes = JSON.parse(JSON.stringify(procs)) as Process[]
      const available = JSON.parse(
        JSON.stringify(res.reduce((acc, r) => ({ ...acc, [r.id]: r.available }), {})),
      ) as Record<string, number>

      // Track if any process was able to finish in each iteration
      let processFinished = true

      // Keep track of the safe sequence
      const sequence: string[] = []

      // Continue until all processes are finished or no progress can be made
      while (processFinished) {
        processFinished = false

        // Try to find a process that can finish
        for (const process of processes) {
          if (process.finished) continue

          // Check if all needed resources are available
          const canFinish = Object.keys(process.need).every(
            (resourceId) => process.need[resourceId] <= available[resourceId],
          )

          if (canFinish) {
            // Mark process as finished
            process.finished = true
            processFinished = true

            // Release its resources
            Object.keys(process.allocation).forEach((resourceId) => {
              available[resourceId] += process.allocation[resourceId]
            })

            // Add to safe sequence
            sequence.push(process.id)
          }
        }
      }

      // Check if all processes are finished
      const allFinished = processes.every((p) => p.finished)

      if (allFinished) {
        // Only update the safe sequence if we're checking the actual game state
        if (JSON.stringify(procs) === JSON.stringify(processes)) {
          setSafeSequence(sequence)
        }
        return true
      }

      return false
    } catch (err) {
      console.error("Error checking safe state:", err)
      return false
    }
  }

  // Execute a process
  const executeProcess = (processId: string) => {
    try {
      // Check if the process can be executed
      const process = processes.find((p) => p.id === processId)
      if (!process || process.finished) return

      // Check if all needed resources are available
      const canExecute = Object.keys(process.need).every((resourceId) => {
        const resource = resources.find((r) => r.id === resourceId)
        return resource && process.need[resourceId] <= resource.available
      })

      if (!canExecute) {
        // Show error message or visual feedback
        setError(`Cannot execute ${process.name}. Not enough resources available.`)
        setTimeout(() => setError(null), 3000)
        return
      }

      // Execute the process
      setProcesses((prev) => prev.map((p) => (p.id === processId ? { ...p, finished: true } : p)))

      // Release its resources
      setResources((prev) =>
        prev.map((r) => ({
          ...r,
          available: r.available + (process.allocation[r.id] || 0),
        })),
      )

      // Add to safe sequence
      setSafeSequence((prev) => [...prev, processId])

      // Increment moves
      setMoves((prev) => prev + 1)

      // Clear any previous errors
      setError(null)

      // Check if all processes are finished
      const allFinished = processes.filter((p) => p.id !== processId).every((p) => p.finished)

      if (allFinished) {
        // Game won!
        setGameWon(true)

        // Calculate score
        const level = levels[currentLevel - 1]
        const timeBonus = Math.max(0, level.timeLimit - time)
        const moveBonus = Math.max(0, level.minMoves * 20 - moves * 10)
        const hintPenalty = hintsUsed * 50

        const finalScore = 1000 + timeBonus + moveBonus - hintPenalty

        setScore(finalScore)
      }
    } catch (err) {
      console.error("Error executing process:", err)
      setError("An error occurred while executing the process. Please try again.")
    }
  }

  // Reset the game
  const resetGame = () => {
    try {
      // Reset processes
      setProcesses((prev) =>
        prev.map((p) => ({
          ...p,
          finished: false,
        })),
      )

      // Reset resources
      setResources((prev) => {
        const newResources = [...prev]

        // Recalculate available resources
        newResources.forEach((resource) => {
          const allocated = processes.reduce((sum, process) => sum + (process.allocation[resource.id] || 0), 0)
          resource.available = resource.total - allocated
        })

        return newResources
      })

      // Reset safe sequence
      setSafeSequence([])

      // Increment moves
      setMoves((prev) => prev + 1)

      // Clear any errors
      setError(null)
    } catch (err) {
      console.error("Error resetting game:", err)
      setError("Failed to reset the game. Please try again.")
    }
  }

  // Use a hint
  const useHint = () => {
    if (hintsAvailable <= 0) return

    // Decrement available hints
    setHintsAvailable((prev) => prev - 1)
    setHintsUsed((prev) => prev + 1)

    // Show hint
    setShowHint(true)

    // Hide hint after 5 seconds
    setTimeout(() => {
      setShowHint(false)
    }, 5000)
  }

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`
  }

  // Generate hint text
  const getHintText = (): string => {
    // Check if there's a safe sequence
    const isSafe = checkSafeState(processes, resources)

    if (!isSafe) {
      // Find processes that are causing the deadlock
      const deadlockedProcesses = processes.filter((p) => !p.finished)

      return `Look for processes that need more resources than available. Try executing processes in a different order.`
    } else {
      // Suggest the next process to execute
      const nextProcess = safeSequence[0]
      const process = processes.find((p) => p.id === nextProcess)

      return `Try executing ${process?.name} next. It has sufficient resources available.`
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-os-darker flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-os-purple"></div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-os-darker flex flex-col">
      {/* Header */}
      <header className="bg-os-dark border-b border-os-light p-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <Link href="/simulation" className="text-white hover:text-os-purple transition-colors mr-4">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl font-bold text-white flex items-center">
              <Puzzle className="mr-2 text-os-purple" />
              Hack the OS
            </h1>
          </div>
          <nav className="flex space-x-4">
            <Link href="/" className="text-white hover:text-os-purple transition-colors flex items-center">
              <Home className="mr-1" size={16} />
              Home
            </Link>
          </nav>
        </div>
      </header>

      {/* Game Content */}
      <div className="flex-1 container mx-auto p-4">
        {!gameStarted ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-os-dark rounded-lg border border-os-light p-6 shadow-lg"
          >
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">Select a Puzzle</h2>
              <p className="text-gray-400">
                Solve OS puzzles by analyzing the system's current allocation matrix and determining the safe execution
                sequence to avoid deadlock.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {levels.map((level) => (
                <motion.div
                  key={level.id}
                  whileHover={{ scale: 1.03 }}
                  className={`bg-os-darker border border-${level.color} rounded-lg p-4 cursor-pointer relative overflow-hidden`}
                  onClick={() => setCurrentLevel(level.id)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold text-white">
                      Level {level.id}: {level.name}
                    </h3>
                    <span className={`text-xs px-2 py-1 rounded-full bg-${level.color}/20 text-${level.color}`}>
                      {level.difficulty}
                    </span>
                  </div>
                  <p className="text-gray-300 text-sm mb-3">{level.description}</p>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <LightbulbIcon className="h-4 w-4 text-os-yellow mr-1" />
                      <span className="text-xs text-gray-400">Hints: 3</span>
                    </div>
                    {level.id <= 1 ? (
                      <Unlock className="h-4 w-4 text-os-green" />
                    ) : (
                      <Lock className="h-4 w-4 text-gray-500" />
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="flex justify-center">
              <button
                className={`bg-os-purple hover:bg-purple-600 text-white py-3 px-8 rounded-md transition-colors text-lg font-bold ${
                  currentLevel > 1 ? "opacity-50 cursor-not-allowed" : ""
                }`}
                disabled={currentLevel > 1}
                onClick={initializeGame}
              >
                Start Puzzle {currentLevel}
              </button>
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left Column - Game Info */}
            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-os-dark rounded-lg border border-os-light p-4 shadow-lg"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white">Puzzle Info</h2>
                  <div className="flex items-center space-x-2">
                    <button
                      className={`p-2 rounded-md ${paused ? "bg-os-green" : "bg-os-yellow"}`}
                      onClick={() => setPaused(!paused)}
                    >
                      {paused ? <Play className="h-4 w-4 text-white" /> : <Pause className="h-4 w-4 text-white" />}
                    </button>
                    <div className="text-os-yellow font-mono">
                      {formatTime(levels[currentLevel - 1].timeLimit - time)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-os-darker rounded-md p-3 border border-os-light">
                    <div className="text-center">
                      <div className="text-gray-400 text-sm">Level</div>
                      <div className="text-xl font-bold text-os-purple">{currentLevel}</div>
                    </div>
                  </div>
                  <div className="bg-os-darker rounded-md p-3 border border-os-light">
                    <div className="text-center">
                      <div className="text-gray-400 text-sm">Moves</div>
                      <div className="text-xl font-bold text-os-blue">{moves}</div>
                    </div>
                  </div>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-red-900/30 border border-red-700 rounded-md p-3 flex items-start mb-4"
                  >
                    <AlertTriangle className="text-os-red mr-2 h-5 w-5 mt-1 flex-shrink-0" />
                    <div className="text-os-red text-sm">{error}</div>
                  </motion.div>
                )}

                <div className="bg-os-darker rounded-md p-3 border border-os-light mb-4">
                  <h3 className="text-sm font-bold text-gray-300 mb-2">Safe Sequence</h3>
                  <div className="flex flex-wrap gap-2">
                    {safeSequence.length > 0 ? (
                      safeSequence.map((processId, index) => {
                        const process = processes.find((p) => p.id === processId)
                        return (
                          <div key={index} className="bg-os-green/20 text-os-green px-2 py-1 rounded-md text-sm">
                            {process?.name}
                          </div>
                        )
                      })
                    ) : (
                      <div className="text-gray-400 text-sm">No safe sequence found yet</div>
                    )}
                  </div>
                </div>

                <div className="bg-os-darker rounded-md p-3 border border-os-light">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-bold text-gray-300">Hints</h3>
                    <span className="text-xs text-gray-400">{hintsAvailable} remaining</span>
                  </div>
                  <button
                    className={`w-full py-2 px-4 rounded-md ${
                      hintsAvailable > 0
                        ? "bg-os-yellow text-white hover:bg-yellow-600"
                        : "bg-os-darker text-gray-500 cursor-not-allowed"
                    }`}
                    onClick={useHint}
                    disabled={hintsAvailable <= 0}
                  >
                    <LightbulbIcon className="inline-block mr-2 h-4 w-4" />
                    Use Hint
                  </button>

                  {showHint && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-3 bg-os-yellow/10 border border-os-yellow/30 rounded-md p-2 text-xs text-os-yellow"
                    >
                      <div className="flex items-start">
                        <LightbulbIcon className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
                        <p>{getHintText()}</p>
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-os-dark rounded-lg border border-os-light p-4 shadow-lg"
              >
                <h2 className="text-xl font-bold text-white mb-4">Resources</h2>
                <div className="space-y-3">
                  {resources.map((resource) => (
                    <div key={resource.id} className="bg-os-darker rounded-md p-3 border border-os-light">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-white font-bold">Resource {resource.name}</h3>
                        <div className="text-sm font-mono text-os-green">
                          {resource.available}/{resource.total}
                        </div>
                      </div>
                      <div className="w-full bg-os-light rounded-full h-2">
                        <motion.div
                          className="bg-os-green h-2 rounded-full"
                          style={{ width: `${(resource.available / resource.total) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Middle and Right Columns - Banker's Algorithm Matrix */}
            <div className="lg:col-span-2 space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-os-dark rounded-lg border border-os-light p-4 shadow-lg"
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-white">Resource Allocation Matrix</h2>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="p-2 rounded-md bg-os-darker text-gray-400 hover:text-white">
                          <HelpCircle className="h-4 w-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-sm">
                          The allocation matrix shows how many resources of each type are currently allocated to each
                          process.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="text-left p-2 text-gray-400">Process</th>
                        {resources.map((resource) => (
                          <th key={resource.id} className="text-center p-2 text-gray-400">
                            {resource.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {processes.map((process) => (
                        <tr
                          key={process.id}
                          className={`border-t border-os-light ${process.finished ? "opacity-50" : ""}`}
                        >
                          <td className="p-2 text-white font-bold">{process.name}</td>
                          {resources.map((resource) => (
                            <td key={resource.id} className="text-center p-2 text-white">
                              {process.allocation[resource.id] !== undefined ? process.allocation[resource.id] : 0}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-os-dark rounded-lg border border-os-light p-4 shadow-lg"
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-white">Need Matrix</h2>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="p-2 rounded-md bg-os-darker text-gray-400 hover:text-white">
                          <HelpCircle className="h-4 w-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-sm">
                          The need matrix shows how many more resources each process needs (Max - Allocation).
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="text-left p-2 text-gray-400">Process</th>
                        {resources.map((resource) => (
                          <th key={resource.id} className="text-center p-2 text-gray-400">
                            {resource.name}
                          </th>
                        ))}
                        <th className="text-center p-2 text-gray-400">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {processes.map((process) => (
                        <tr
                          key={process.id}
                          className={`border-t border-os-light ${process.finished ? "opacity-50" : ""}`}
                        >
                          <td className="p-2 text-white font-bold">{process.name}</td>
                          {resources.map((resource) => (
                            <td key={resource.id} className="text-center p-2 text-white">
                              {process.need[resource.id] !== undefined ? process.need[resource.id] : 0}
                            </td>
                          ))}
                          <td className="text-center p-2">
                            {!process.finished ? (
                              <button
                                className="bg-os-purple hover:bg-purple-600 text-white py-1 px-3 rounded-md text-sm"
                                onClick={() => executeProcess(process.id)}
                              >
                                Execute
                              </button>
                            ) : (
                              <span className="text-os-green text-sm">Completed</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 flex justify-end">
                  <button
                    className="bg-os-light hover:bg-os-lighter text-white py-2 px-4 rounded-md flex items-center"
                    onClick={resetGame}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reset Puzzle
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        )}

        {/* Game Won Modal */}
        <AnimatePresence>
          {gameWon && showModel &&(
            <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-os-dark rounded-lg border border-os-light p-6 shadow-xl w-full max-w-md relative"
            >
              {/* Close Button */}
              <button
                className="absolute top-4 right-4 text-os-light hover:text-white transition-colors text-xl"
                onClick={() => {
                  setGameStarted(false)
                  if (gameLoopRef.current) {
                    cancelAnimationFrame(gameLoopRef.current)
                  }
                  setShowModel(false)  // Ensure this state exists and controls modal visibility
                }}
              >
                <MoveLeft/>
              </button>
          
              <div className="flex items-center justify-center mb-4">
                <CheckCircle className="text-os-green h-12 w-12" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-4 text-center">Puzzle Solved!</h2>
          
              <div className="bg-os-darker rounded-md p-4 border border-os-light mb-4">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-gray-400 text-sm">Score</div>
                    <div className="text-3xl font-bold text-os-green">{score.toFixed(2)}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-400 text-sm">Time</div>
                    <div className="text-3xl font-bold text-os-blue">{formatTime(time)}</div>
                  </div>
                </div>
          
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-gray-400 text-sm">Moves</div>
                    <div className="text-xl font-bold text-os-purple">{moves}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-400 text-sm">Hints Used</div>
                    <div className="text-xl font-bold text-os-yellow">{hintsUsed}</div>
                  </div>
                </div>
              </div>
          
              <div className="flex justify-between">
                <button
                  className="bg-os-light text-white py-2 px-4 rounded-md hover:bg-os-lighter transition-colors"
                  onClick={() => {
                    setGameStarted(false)
                    if (gameLoopRef.current) {
                      cancelAnimationFrame(gameLoopRef.current)
                    }
                    setShowModel(false)
                  }}
                >
                  Back to Puzzles
                </button>
          
                {currentLevel < levels.length && (
                  <button
                    className="bg-os-purple text-white py-2 px-4 rounded-md hover:bg-purple-600 transition-colors"
                    onClick={() => {
                      setCurrentLevel((prev) => prev + 1)
                      setGameStarted(false)
                      if (gameLoopRef.current) {
                        cancelAnimationFrame(gameLoopRef.current)
                      }
                      setShowModel(false)
                      setTimeout(initializeGame, 100)
                    }}
                  >
                    Next Puzzle
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
          
          )}
        </AnimatePresence>

        {/* Game Over Modal */}
        <AnimatePresence>
          {gameOver && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                className="bg-os-dark rounded-lg border border-os-light p-6 shadow-xl w-full max-w-md"
              >
                <div className="flex items-center justify-center mb-4">
                  <XCircle className="text-os-red h-12 w-12" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-4 text-center">Time's Up!</h2>

                <p className="text-gray-300 text-center mb-6">
                  You ran out of time before finding a safe sequence. Try again!
                </p>

                <div className="flex justify-between">
                  <button
                    className="bg-os-light text-white py-2 px-4 rounded-md hover:bg-os-lighter transition-colors"
                    onClick={() => {
                      setGameStarted(false)
                      if (gameLoopRef.current) {
                        cancelAnimationFrame(gameLoopRef.current)
                      }
                    }}
                  >
                    Back to Puzzles
                  </button>

                  <button
                    className="bg-os-purple text-white py-2 px-4 rounded-md hover:bg-purple-600 transition-colors"
                    onClick={() => {
                      if (gameLoopRef.current) {
                        cancelAnimationFrame(gameLoopRef.current)
                      }
                      setTimeout(initializeGame, 100)
                    }}
                  >
                    Try Again
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tutorial Modal */}
        <AnimatePresence>
          {showTutorial && gameStarted && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                className="bg-os-dark rounded-lg border border-os-light p-6 shadow-xl w-full max-w-md"
              >
                <h2 className="text-2xl font-bold text-white mb-4">How to Play</h2>

                <div className="space-y-4 mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-os-purple mb-1">Objective</h3>
                    <p className="text-gray-300 text-sm">
                      Find a safe sequence of process executions that avoids deadlock using the Banker's Algorithm.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-os-green mb-1">How It Works</h3>
                    <ul className="text-gray-300 text-sm list-disc pl-5 space-y-1">
                      <li>Each process needs resources to complete</li>
                      <li>The "Need" matrix shows how many more resources each process requires</li>
                      <li>A process can only execute if all its needed resources are available</li>
                      <li>When a process executes, it releases all its allocated resources</li>
                      <li>Find the right order to execute all processes without deadlock</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-os-yellow mb-1">Tips</h3>
                    <p className="text-gray-300 text-sm">
                      Look for processes with small resource needs that can be satisfied with currently available
                      resources. Execute them first to free up resources for other processes.
                    </p>
                  </div>
                </div>

                <button
                  className="w-full bg-os-purple text-white py-2 px-4 rounded-md hover:bg-purple-600 transition-colors"
                  onClick={() => setShowTutorial(false)}
                >
                  Got it!
                </button>
                <button
                  className="absolute top-2 right-2 text-gray-400 hover:text-white"
                  onClick={() => setShowTutorial(false)}
                >
                  ✕
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <footer className="bg-os-dark border-t border-os-light p-4 text-center text-gray-400">
        <p>© 2023 OS Resource Allocation Simulator | Educational Project</p>
      </footer>
    </main>
  )
}
