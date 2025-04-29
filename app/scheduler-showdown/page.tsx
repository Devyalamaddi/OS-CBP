"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Home, ArrowLeft, Clock, Users, Trophy, Play, Pause, BarChart, XCircle, Plus, Minus } from "lucide-react"

// Types
type Process = {
  id: string
  name: string
  arrivalTime: number
  burstTime: number
  priority: number
  remainingTime: number
  startTime: number | null
  finishTime: number | null
  waitingTime: number
  turnaroundTime: number | null
  responseTime: number | null
  color: string
}

type SchedulingAlgorithm = "FCFS" | "SJF" | "Priority" | "RR"

type Player = {
  id: string
  name: string
  algorithm: SchedulingAlgorithm
  processes: Process[]
  currentTime: number
  completed: boolean
  averageWaitingTime: number
  averageTurnaroundTime: number
  averageResponseTime: number
  cpuUtilization: number
  score: number
  color: string
}

type Level = {
  id: number
  name: string
  description: string
  algorithm: SchedulingAlgorithm | "Mixed"
  color: string
  processes: number
  timeLimit: number
  quantum?: number
}

export default function SchedulerShowdownPage() {
  const [participants, setParticipants] = useState<number>(2)
  const [currentLevel, setCurrentLevel] = useState<number>(1)
  const [isLoading, setIsLoading] = useState(true)
  const [gameStarted, setGameStarted] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [gameWon, setGameWon] = useState(false)
  const [winner, setWinner] = useState<Player | null>(null)
  const [time, setTime] = useState(0)
  const [paused, setPaused] = useState(false)
  const [players, setPlayers] = useState<Player[]>([])
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<SchedulingAlgorithm>("FCFS")
  const [opponentAlgorithm, setOpponentAlgorithm] = useState<SchedulingAlgorithm>("SJF")
  const [showTutorial, setShowTutorial] = useState(true)
  const [simulationSpeed, setSimulationSpeed] = useState(1)
  const [showGanttChart, setShowGanttChart] = useState(false)
  const [quantum, setQuantum] = useState(2)
  const [showProcessSetup, setShowProcessSetup] = useState(false)
  const [currentPlayerSetup, setCurrentPlayerSetup] = useState(0)
  const [playerProcesses, setPlayerProcesses] = useState<Process[][]>([])
  const [playerNames, setPlayerNames] = useState<string[]>([])
  const [tempProcess, setTempProcess] = useState<{
    name: string
    arrivalTime: number
    burstTime: number
    priority: number
  }>({
    name: "P1",
    arrivalTime: 0,
    burstTime: 5,
    priority: 1,
  })

  const gameLoopRef = useRef<number | null>(null)

  // Process colors
  const processColors = [
    "#4FACFE", // Blue
    "#9D50BB", // Purple
    "#43E97B", // Green
    "#FF5E62", // Red
    "#FFDB3A", // Yellow
    "#00C9FF", // Cyan
    "#FF8C00", // Orange
  ]

  // Player colors
  const playerColors = ["#4FACFE", "#FF5E62", "#43E97B", "#9D50BB", "#FFDB3A", "#00C9FF", "#FF8C00"]

  // Level configurations
  const levels: Level[] = [
    {
      id: 1,
      name: "FCFS Frenzy",
      description: "First-Come, First-Served challenge. Optimize arrival times for best performance.",
      algorithm: "FCFS",
      color: "os-green",
      processes: 5,
      timeLimit: 120, // seconds
    },
    {
      id: 2,
      name: "SJF Rush",
      description: "Shortest Job First competition. Balance short and long processes for optimal throughput.",
      algorithm: "SJF",
      color: "os-blue",
      processes: 6,
      timeLimit: 180,
    },
    {
      id: 3,
      name: "Priority Planner",
      description: "Priority-based scheduling challenge. Assign priorities strategically to minimize waiting time.",
      algorithm: "Priority",
      color: "os-purple",
      processes: 6,
      timeLimit: 240,
    },
    {
      id: 4,
      name: "RR Challenge",
      description: "Round Robin with quantum setting. Find the optimal time quantum for your process mix.",
      algorithm: "RR",
      color: "os-yellow",
      processes: 7,
      timeLimit: 300,
      quantum: 2,
    },
    {
      id: 5,
      name: "Hybrid Mode",
      description: "Players choose different algorithms and compete head-to-head. May the best scheduler win!",
      algorithm: "Mixed",
      color: "os-red",
      processes: 8,
      timeLimit: 360,
    },
  ]

  useEffect(() => {
    // Get participants from localStorage
    const storedParticipants = localStorage.getItem("Scheduler Showdown-participants")
    if (storedParticipants) {
      setParticipants(Number.parseInt(storedParticipants))
    }

    // Initialize player names and processes arrays
    const names = Array(participants)
      .fill("")
      .map((_, i) => `Player ${i + 1}`)
    setPlayerNames(names)
    setPlayerProcesses(Array(participants).fill([]))

    setIsLoading(false)
  }, [participants])

  // Start process setup
  const startProcessSetup = () => {
    setShowProcessSetup(true)
    setCurrentPlayerSetup(0)

    // Reset player processes
    setPlayerProcesses(
      Array(participants)
        .fill([])
        .map(() => []),
    )
  }

  // Add process for current player
  const addProcess = () => {
    const newProcess: Process = {
      id: `p-${currentPlayerSetup}-${playerProcesses[currentPlayerSetup].length}`,
      name: tempProcess.name,
      arrivalTime: tempProcess.arrivalTime,
      burstTime: tempProcess.burstTime,
      priority: tempProcess.priority,
      remainingTime: tempProcess.burstTime,
      startTime: null,
      finishTime: null,
      waitingTime: 0,
      turnaroundTime: null,
      responseTime: null,
      color: processColors[playerProcesses[currentPlayerSetup].length % processColors.length],
    }

    setPlayerProcesses((prev) => {
      const newProcesses = [...prev]
      newProcesses[currentPlayerSetup] = [...newProcesses[currentPlayerSetup], newProcess]
      return newProcesses
    })

    // Reset temp process with incremented name
    setTempProcess({
      name: `P${playerProcesses[currentPlayerSetup].length + 2}`,
      arrivalTime: 0,
      burstTime: 5,
      priority: 1,
    })
  }

  // Remove process for current player
  const removeProcess = (index: number) => {
    setPlayerProcesses((prev) => {
      const newProcesses = [...prev]
      newProcesses[currentPlayerSetup] = newProcesses[currentPlayerSetup].filter((_, i) => i !== index)
      return newProcesses
    })
  }

  // Move to next player setup
  const nextPlayerSetup = () => {
    if (playerProcesses[currentPlayerSetup].length === 0) {
      alert("Please add at least one process for this player")
      return
    }

    if (currentPlayerSetup < participants - 1) {
      setCurrentPlayerSetup((prev) => prev + 1)
      // Reset temp process
      setTempProcess({
        name: "P1",
        arrivalTime: 0,
        burstTime: 5,
        priority: 1,
      })
    } else {
      // All players set up, start the game
      setShowProcessSetup(false)
      initializeGame()
    }
  }

  // Initialize game with custom processes
  const initializeGame = () => {
    const level = levels[currentLevel - 1]

    // Create players
    const newPlayers: Player[] = []

    // Create players based on participant count
    for (let i = 0; i < participants; i++) {
      const playerAlgorithm =
        i === 0 && level.algorithm === "Mixed"
          ? selectedAlgorithm
          : i === 1 && level.algorithm === "Mixed"
            ? opponentAlgorithm
            : (level.algorithm as SchedulingAlgorithm)

      newPlayers.push({
        id: `player-${i}`,
        name: playerNames[i] || `Player ${i + 1}`,
        algorithm: playerAlgorithm,
        processes: playerProcesses[i].length > 0 ? [...playerProcesses[i]] : generateProcesses(level.processes, i),
        currentTime: 0,
        completed: false,
        averageWaitingTime: 0,
        averageTurnaroundTime: 0,
        averageResponseTime: 0,
        cpuUtilization: 0,
        score: 0,
        color: playerColors[i % playerColors.length],
      })
    }

    setPlayers(newPlayers)
    setTime(0)
    setGameStarted(true)
    setGameOver(false)
    setGameWon(false)
    setWinner(null)
    setPaused(false)
    setShowTutorial(true)
    setQuantum(level.quantum || 2)
  }

  // Generate processes
  const generateProcesses = (count: number, playerIndex: number): Process[] => {
    const processes: Process[] = []

    for (let i = 0; i < count; i++) {
      processes.push({
        id: `p-${playerIndex}-${i}`,
        name: `P${i + 1}`,
        arrivalTime: Math.floor(Math.random() * 10),
        burstTime: Math.floor(Math.random() * 8) + 2,
        priority: Math.floor(Math.random() * 10) + 1,
        remainingTime: Math.floor(Math.random() * 8) + 2,
        startTime: null,
        finishTime: null,
        waitingTime: 0,
        turnaroundTime: null,
        responseTime: null,
        color: processColors[i % processColors.length],
      })
    }

    return processes
  }

  // Game loop
  useEffect(() => {
    if (!gameStarted || paused || gameOver || gameWon) return

    const level = levels[currentLevel - 1]

    const gameLoop = () => {
      // Update time
      setTime((prev) => {
        const newTime = prev + 0.1 * simulationSpeed

        // Check if time limit reached
        if (newTime >= level.timeLimit) {
          setGameOver(true)
          return prev
        }

        return newTime
      })

      // Update players
      setPlayers((prevPlayers) => {
        const updatedPlayers = [...prevPlayers]

        // Run scheduling algorithm for each player
        updatedPlayers.forEach((player) => {
          if (player.completed) return

          // Increment current time
          player.currentTime += 0.1 * simulationSpeed

          // Run the appropriate scheduling algorithm
          switch (player.algorithm) {
            case "FCFS":
              runFCFS(player)
              break
            case "SJF":
              runSJF(player)
              break
            case "Priority":
              runPriority(player)
              break
            case "RR":
              runRR(player, quantum)
              break
          }

          // Check if all processes are completed
          const allCompleted = player.processes.every((p) => p.finishTime !== null)

          if (allCompleted && !player.completed) {
            player.completed = true

            // Calculate metrics
            calculateMetrics(player)
          }
        })

        // Check if all players have completed
        const allPlayersCompleted = updatedPlayers.every((p) => p.completed)

        if (allPlayersCompleted && !gameWon && !gameOver) {
          // Determine winner
          const winningPlayer = updatedPlayers.reduce((prev, current) => (prev.score > current.score ? prev : current))

          setWinner(winningPlayer)
          setGameWon(true)
        }

        return updatedPlayers
      })

      gameLoopRef.current = requestAnimationFrame(gameLoop)
    }

    gameLoopRef.current = requestAnimationFrame(gameLoop)

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current)
      }
    }
  }, [gameStarted, paused, gameOver, gameWon, currentLevel, simulationSpeed, quantum])

  // First-Come, First-Served (FCFS) scheduling algorithm
  const runFCFS = (player: Player) => {
    const { processes, currentTime } = player

    // Get arrived processes that haven't finished
    const arrivedProcesses = processes.filter((p) => p.arrivalTime <= currentTime && p.finishTime === null)

    if (arrivedProcesses.length === 0) return

    // Sort by arrival time
    arrivedProcesses.sort((a, b) => a.arrivalTime - b.arrivalTime)

    // Get the first process
    const currentProcess = arrivedProcesses[0]

    // If process hasn't started, set start time
    if (currentProcess.startTime === null) {
      currentProcess.startTime = currentTime
      currentProcess.responseTime = currentTime - currentProcess.arrivalTime
    }

    // Reduce remaining time
    currentProcess.remainingTime -= 0.1 * simulationSpeed

    // If process is completed
    if (currentProcess.remainingTime <= 0) {
      currentProcess.remainingTime = 0
      currentProcess.finishTime = currentTime
      currentProcess.turnaroundTime = currentTime - currentProcess.arrivalTime
      currentProcess.waitingTime = currentProcess.turnaroundTime - currentProcess.burstTime
    }
  }

  // Shortest Job First (SJF) scheduling algorithm
  const runSJF = (player: Player) => {
    const { processes, currentTime } = player

    // Get arrived processes that haven't finished
    const arrivedProcesses = processes.filter((p) => p.arrivalTime <= currentTime && p.finishTime === null)

    if (arrivedProcesses.length === 0) return

    // Sort by remaining time (shortest first)
    arrivedProcesses.sort((a, b) => a.remainingTime - b.remainingTime)

    // Get the process with shortest remaining time
    const currentProcess = arrivedProcesses[0]

    // If process hasn't started, set start time
    if (currentProcess.startTime === null) {
      currentProcess.startTime = currentTime
      currentProcess.responseTime = currentTime - currentProcess.arrivalTime
    }

    // Reduce remaining time
    currentProcess.remainingTime -= 0.1 * simulationSpeed

    // If process is completed
    if (currentProcess.remainingTime <= 0) {
      currentProcess.remainingTime = 0
      currentProcess.finishTime = currentTime
      currentProcess.turnaroundTime = currentTime - currentProcess.arrivalTime
      currentProcess.waitingTime = currentProcess.turnaroundTime - currentProcess.burstTime
    }
  }

  // Priority scheduling algorithm
  const runPriority = (player: Player) => {
    const { processes, currentTime } = player

    // Get arrived processes that haven't finished
    const arrivedProcesses = processes.filter((p) => p.arrivalTime <= currentTime && p.finishTime === null)

    if (arrivedProcesses.length === 0) return

    // Sort by priority (highest priority first - lower number means higher priority)
    arrivedProcesses.sort((a, b) => a.priority - b.priority)

    // Get the process with highest priority
    const currentProcess = arrivedProcesses[0]

    // If process hasn't started, set start time
    if (currentProcess.startTime === null) {
      currentProcess.startTime = currentTime
      currentProcess.responseTime = currentTime - currentProcess.arrivalTime
    }

    // Reduce remaining time
    currentProcess.remainingTime -= 0.1 * simulationSpeed

    // If process is completed
    if (currentProcess.remainingTime <= 0) {
      currentProcess.remainingTime = 0
      currentProcess.finishTime = currentTime
      currentProcess.turnaroundTime = currentTime - currentProcess.arrivalTime
      currentProcess.waitingTime = currentProcess.turnaroundTime - currentProcess.burstTime
    }
  }

  // Round Robin (RR) scheduling algorithm
  const runRR = (player: Player, quantum: number) => {
    const { processes, currentTime } = player

    // Get arrived processes that haven't finished
    const arrivedProcesses = processes.filter((p) => p.arrivalTime <= currentTime && p.finishTime === null)

    if (arrivedProcesses.length === 0) return

    // Sort by arrival time
    arrivedProcesses.sort((a, b) => a.arrivalTime - b.arrivalTime)

    // Get the first process
    const currentProcess = arrivedProcesses[0]

    // If process hasn't started, set start time
    if (currentProcess.startTime === null) {
      currentProcess.startTime = currentTime
      currentProcess.responseTime = currentTime - currentProcess.arrivalTime
    }

    // Reduce remaining time
    currentProcess.remainingTime -= 0.1 * simulationSpeed

    // If process is completed
    if (currentProcess.remainingTime <= 0) {
      currentProcess.remainingTime = 0
      currentProcess.finishTime = currentTime
      currentProcess.turnaroundTime = currentTime - currentProcess.arrivalTime
      currentProcess.waitingTime = currentProcess.turnaroundTime - currentProcess.burstTime
    } else {
      // Check if quantum is reached
      const timeSpent = currentTime - (currentProcess.startTime || 0)
      if (timeSpent >= quantum) {
        // Move process to the end of the queue
        const index = processes.findIndex((p) => p.id === currentProcess.id)
        if (index !== -1) {
          const process = processes.splice(index, 1)[0]
          processes.push(process)
        }
      }
    }
  }

  // Calculate metrics for a player
  const calculateMetrics = (player: Player) => {
    const { processes } = player

    // Calculate average waiting time
    const totalWaitingTime = processes.reduce((sum, process) => sum + process.waitingTime, 0)
    player.averageWaitingTime = totalWaitingTime / processes.length

    // Calculate average turnaround time
    const totalTurnaroundTime = processes.reduce((sum, process) => sum + (process.turnaroundTime || 0), 0)
    player.averageTurnaroundTime = totalTurnaroundTime / processes.length

    // Calculate average response time
    const totalResponseTime = processes.reduce((sum, process) => sum + (process.responseTime || 0), 0)
    player.averageResponseTime = totalResponseTime / processes.length

    // Calculate CPU utilization
    const totalBurstTime = processes.reduce((sum, process) => sum + process.burstTime, 0)
    const lastFinishTime = Math.max(...processes.map((p) => p.finishTime || 0))
    player.cpuUtilization = (totalBurstTime / lastFinishTime) * 100

    // Calculate score
    // Lower waiting time, turnaround time, and response time are better
    // Higher CPU utilization is better
    const waitingTimeScore = 100 - player.averageWaitingTime * 10
    const turnaroundTimeScore = 100 - player.averageTurnaroundTime * 5
    const responseTimeScore = 100 - player.averageResponseTime * 10
    const utilizationScore = player.cpuUtilization

    player.score = waitingTimeScore + turnaroundTimeScore + responseTimeScore + utilizationScore
  }

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`
  }

  // Get algorithm name
  const getAlgorithmName = (algorithm: SchedulingAlgorithm): string => {
    switch (algorithm) {
      case "FCFS":
        return "First-Come, First-Served"
      case "SJF":
        return "Shortest Job First"
      case "Priority":
        return "Priority Scheduling"
      case "RR":
        return "Round Robin"
      default:
        return algorithm
    }
  }

  // Get algorithm description
  const getAlgorithmDescription = (algorithm: SchedulingAlgorithm): string => {
    switch (algorithm) {
      case "FCFS":
        return "Processes are executed in the order they arrive. Simple but can lead to long waiting times."
      case "SJF":
        return "Executes the process with the shortest burst time first. Optimal for minimizing average waiting time."
      case "Priority":
        return "Executes processes based on priority. Higher priority processes are executed first."
      case "RR":
        return "Each process gets a small unit of CPU time (quantum), then is preempted. Good for time-sharing systems."
      default:
        return ""
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-os-darker flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-os-green"></div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-os-darker flex flex-col">
      {/* Header */}
      <header className="bg-os-dark border-b border-os-light p-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <Link href="/simulation" className="text-white hover:text-os-green transition-colors mr-4">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl font-bold text-white flex items-center">
              <Clock className="mr-2 text-os-green" />
              Scheduler Showdown
            </h1>
          </div>
          <nav className="flex space-x-4">
            <Link href="/" className="text-white hover:text-os-green transition-colors flex items-center">
              <Home className="mr-1" size={16} />
              Home
            </Link>
          </nav>
        </div>
      </header>

      {/* Game Content */}
      <div className="flex-1 container mx-auto p-4">
        {!gameStarted && !showProcessSetup ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-os-dark rounded-lg border border-os-light p-6 shadow-lg"
          >
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">Select a Competition</h2>
              <p className="text-gray-400">
                Compete against {participants} other players by selecting CPU scheduling algorithms and optimizing
                process execution.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {levels.map((level) => (
                <motion.div
                  key={level.id}
                  whileHover={{ scale: 1.03 }}
                  className={`bg-os-darker border border-${level.color} rounded-lg p-4 cursor-pointer`}
                  onClick={() => setCurrentLevel(level.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-bold text-white">
                      Level {level.id}: {level.name}
                    </h3>
                    <span className={`text-xs px-2 py-1 rounded-full bg-${level.color}/20 text-${level.color}`}>
                      {level.algorithm}
                    </span>
                  </div>
                  <p className="text-gray-300 text-sm mb-3">{level.description}</p>

                  <div className="flex items-center text-gray-400 text-xs">
                    <Users className="h-4 w-4 mr-1" />
                    <span>{participants} participants</span>

                    <div className="ml-auto flex items-center">
                      <Trophy className="h-4 w-4 text-os-yellow mr-1" />
                      <span>Top Score: --</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {currentLevel === 5 && (
              <div className="bg-os-darker rounded-lg border border-os-light p-4 mb-6">
                <h3 className="text-lg font-bold text-white mb-3">Choose Your Algorithm</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-gray-300 block mb-2">Your Algorithm:</label>
                    <select
                      className="w-full bg-os-dark border border-os-light rounded-md p-2 text-white"
                      value={selectedAlgorithm}
                      onChange={(e) => setSelectedAlgorithm(e.target.value as SchedulingAlgorithm)}
                    >
                      <option value="FCFS">First-Come, First-Served</option>
                      <option value="SJF">Shortest Job First</option>
                      <option value="Priority">Priority Scheduling</option>
                      <option value="RR">Round Robin</option>
                    </select>
                    <p className="text-sm text-gray-400 mt-2">{getAlgorithmDescription(selectedAlgorithm)}</p>
                  </div>
                  <div>
                    <label className="text-gray-300 block mb-2">Opponent's Algorithm:</label>
                    <select
                      className="w-full bg-os-dark border border-os-light rounded-md p-2 text-white"
                      value={opponentAlgorithm}
                      onChange={(e) => setOpponentAlgorithm(e.target.value as SchedulingAlgorithm)}
                    >
                      <option value="FCFS">First-Come, First-Served</option>
                      <option value="SJF">Shortest Job First</option>
                      <option value="Priority">Priority Scheduling</option>
                      <option value="RR">Round Robin</option>
                    </select>
                    <p className="text-sm text-gray-400 mt-2">{getAlgorithmDescription(opponentAlgorithm)}</p>
                  </div>
                </div>
              </div>
            )}

            {currentLevel === 4 && (
              <div className="bg-os-darker rounded-lg border border-os-light p-4 mb-6">
                <h3 className="text-lg font-bold text-white mb-3">Round Robin Settings</h3>
                <div className="flex items-center">
                  <label className="text-gray-300 mr-4">Time Quantum:</label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    value={quantum}
                    onChange={(e) => setQuantum(Number(e.target.value))}
                    className="w-48 h-2 bg-os-light rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="ml-4 text-white font-mono">{quantum} units</span>
                </div>
                <p className="text-sm text-gray-400 mt-2">
                  A smaller quantum gives each process less CPU time before switching, while a larger quantum reduces
                  context switching overhead.
                </p>
              </div>
            )}

            <div className="flex justify-center">
              <button
                className="bg-os-green hover:bg-green-600 text-white py-3 px-8 rounded-md transition-colors text-lg font-bold"
                onClick={startProcessSetup}
              >
                Setup Processes
              </button>
            </div>
          </motion.div>
        ) : showProcessSetup ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-os-dark rounded-lg border border-os-light p-6 shadow-lg"
          >
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">
                Process Setup for {playerNames[currentPlayerSetup] || `Player ${currentPlayerSetup + 1}`}
              </h2>
              <p className="text-gray-400">
                Define the processes for this player. You need at least one process to continue.
              </p>
            </div>

            <div className="bg-os-darker rounded-lg border border-os-light p-4 mb-6">
              <h3 className="text-lg font-bold text-white mb-3">Add New Process</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-gray-300 block mb-2">Process Name:</label>
                  <input
                    type="text"
                    className="w-full bg-os-dark border border-os-light rounded-md p-2 text-white"
                    value={tempProcess.name}
                    onChange={(e) => setTempProcess({ ...tempProcess, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-gray-300 block mb-2">Arrival Time:</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full bg-os-dark border border-os-light rounded-md p-2 text-white"
                    value={tempProcess.arrivalTime}
                    onChange={(e) => setTempProcess({ ...tempProcess, arrivalTime: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="text-gray-300 block mb-2">Burst Time:</label>
                  <input
                    type="number"
                    min="1"
                    className="w-full bg-os-dark border border-os-light rounded-md p-2 text-white"
                    value={tempProcess.burstTime}
                    onChange={(e) => setTempProcess({ ...tempProcess, burstTime: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="text-gray-300 block mb-2">Priority (lower is higher):</label>
                  <input
                    type="number"
                    min="1"
                    className="w-full bg-os-dark border border-os-light rounded-md p-2 text-white"
                    value={tempProcess.priority}
                    onChange={(e) => setTempProcess({ ...tempProcess, priority: Number(e.target.value) })}
                  />
                </div>
              </div>
              <button
                className="w-full py-2 px-4 rounded-md bg-os-green text-white hover:bg-green-600 flex items-center justify-center"
                onClick={addProcess}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Process
              </button>
            </div>

            <div className="bg-os-darker rounded-lg border border-os-light p-4 mb-6">
              <h3 className="text-lg font-bold text-white mb-3">Current Processes</h3>
              {playerProcesses[currentPlayerSetup].length === 0 ? (
                <p className="text-gray-400 text-center py-4">No processes added yet</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="text-left p-2 text-gray-400">Process</th>
                        <th className="text-center p-2 text-gray-400">Arrival</th>
                        <th className="text-center p-2 text-gray-400">Burst</th>
                        <th className="text-center p-2 text-gray-400">Priority</th>
                        <th className="text-center p-2 text-gray-400">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {playerProcesses[currentPlayerSetup].map((process, index) => (
                        <tr key={process.id} className="border-t border-os-light">
                          <td className="p-2 text-white">{process.name}</td>
                          <td className="text-center p-2 text-white">{process.arrivalTime}</td>
                          <td className="text-center p-2 text-white">{process.burstTime}</td>
                          <td className="text-center p-2 text-white">{process.priority}</td>
                          <td className="text-center p-2">
                            <button
                              className="p-1 rounded-md bg-os-red text-white hover:bg-red-600"
                              onClick={() => removeProcess(index)}
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="flex justify-between">
              <button
                className="bg-os-light text-white py-2 px-4 rounded-md hover:bg-os-lighter transition-colors"
                onClick={() => setShowProcessSetup(false)}
              >
                Cancel
              </button>
              <button
                className="bg-os-green text-white py-2 px-4 rounded-md hover:bg-green-600 transition-colors"
                onClick={nextPlayerSetup}
              >
                {currentPlayerSetup < participants - 1 ? "Next Player" : "Start Game"}
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
                  <h2 className="text-xl font-bold text-white">Competition Info</h2>
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
                      <div className="text-xl font-bold text-os-green">{currentLevel}</div>
                    </div>
                  </div>
                  <div className="bg-os-darker rounded-md p-3 border border-os-light">
                    <div className="text-center">
                      <div className="text-gray-400 text-sm">Algorithm</div>
                      <div className="text-xl font-bold text-os-blue">
                        {levels[currentLevel - 1].algorithm === "Mixed" ? "Mixed" : levels[currentLevel - 1].algorithm}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-os-darker rounded-md p-3 border border-os-light mb-4">
                  <h3 className="text-sm font-bold text-gray-300 mb-2">Simulation Speed</h3>
                  <div className="flex items-center">
                    <input
                      type="range"
                      min="0.5"
                      max="3"
                      step="0.5"
                      value={simulationSpeed}
                      onChange={(e) => setSimulationSpeed(Number(e.target.value))}
                      className="w-full h-2 bg-os-light rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="ml-2 text-white font-mono">{simulationSpeed}x</span>
                  </div>
                </div>

                <div className="bg-os-darker rounded-md p-3 border border-os-light">
                  <button
                    className="w-full py-2 px-4 rounded-md bg-os-blue text-white hover:bg-blue-600 flex items-center justify-center"
                    onClick={() => setShowGanttChart(!showGanttChart)}
                  >
                    <BarChart className="mr-2 h-4 w-4" />
                    {showGanttChart ? "Hide Gantt Chart" : "Show Gantt Chart"}
                  </button>
                </div>
              </motion.div>

              {/* Player Scores */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-os-dark rounded-lg border border-os-light p-4 shadow-lg"
              >
                <h2 className="text-xl font-bold text-white mb-4">Player Scores</h2>

                {players.map((player) => (
                  <div key={player.id} className="bg-os-darker rounded-md p-3 border border-os-light mb-3 last:mb-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: player.color }} />
                        <h3 className="text-white font-bold">{player.name}</h3>
                      </div>
                      <div className="text-sm text-gray-400">
                        {player.algorithm} {player.algorithm === "RR" ? `(Q=${quantum})` : ""}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Waiting Time:</span>
                        <span className="text-white font-mono">{player.averageWaitingTime.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Turnaround Time:</span>
                        <span className="text-white font-mono">{player.averageTurnaroundTime.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Response Time:</span>
                        <span className="text-white font-mono">{player.averageResponseTime.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">CPU Utilization:</span>
                        <span className="text-white font-mono">{player.cpuUtilization.toFixed(2)}%</span>
                      </div>
                    </div>

                    <div className="w-full bg-os-light rounded-full h-2">
                      <motion.div
                        className="h-2 rounded-full"
                        style={{
                          width: `${(player.score / 400) * 100}%`,
                          backgroundColor: player.color,
                        }}
                      />
                    </div>
                    <div className="text-right mt-1 text-sm font-bold" style={{ color: player.color }}>
                      Score: {Math.round(player.score)}
                    </div>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Middle and Right Columns - Process Visualization */}
            <div className="lg:col-span-2 space-y-4">
              {players.map((player) => (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-os-dark rounded-lg border border-os-light p-4 shadow-lg"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: player.color }} />
                      <h2 className="text-xl font-bold text-white">{player.name}'s Processes</h2>
                    </div>
                    <div className="text-sm text-gray-400">Algorithm: {getAlgorithmName(player.algorithm)}</div>
                  </div>

                  {/* Process Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr>
                          <th className="text-left p-2 text-gray-400">Process</th>
                          <th className="text-center p-2 text-gray-400">Arrival</th>
                          <th className="text-center p-2 text-gray-400">Burst</th>
                          <th className="text-center p-2 text-gray-400">Priority</th>
                          <th className="text-center p-2 text-gray-400">Remaining</th>
                          <th className="text-center p-2 text-gray-400">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {player.processes.map((process) => (
                          <tr key={process.id} className="border-t border-os-light">
                            <td className="p-2">
                              <div className="flex items-center">
                                <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: process.color }} />
                                <span className="text-white">{process.name}</span>
                              </div>
                            </td>
                            <td className="text-center p-2 text-white font-mono">{process.arrivalTime.toFixed(1)}</td>
                            <td className="text-center p-2 text-white font-mono">{process.burstTime.toFixed(1)}</td>
                            <td className="text-center p-2 text-white font-mono">{process.priority}</td>
                            <td className="text-center p-2 text-white font-mono">{process.remainingTime.toFixed(1)}</td>
                            <td className="text-center p-2">
                              {process.finishTime !== null ? (
                                <span className="text-os-green text-sm">Completed</span>
                              ) : process.startTime !== null ? (
                                <span className="text-os-yellow text-sm">Running</span>
                              ) : process.arrivalTime <= player.currentTime ? (
                                <span className="text-os-blue text-sm">Ready</span>
                              ) : (
                                <span className="text-gray-400 text-sm">Not Arrived</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Gantt Chart */}
                  {showGanttChart && (
                    <div className="mt-4">
                      <h3 className="text-sm font-bold text-gray-300 mb-2">Gantt Chart</h3>
                      <div className="bg-os-darker rounded-md p-3 border border-os-light">
                        <div className="relative h-10">
                          {player.processes.map((process) => {
                            if (process.startTime === null) return null

                            const startPosition = (process.startTime / player.currentTime) * 100
                            const endPosition = ((process.finishTime || player.currentTime) / player.currentTime) * 100
                            const width = endPosition - startPosition

                            return (
                              <div
                                key={process.id}
                                className="absolute h-full flex items-center justify-center text-xs text-white overflow-hidden"
                                style={{
                                  left: `${startPosition}%`,
                                  width: `${width}%`,
                                  backgroundColor: process.color,
                                  minWidth: "20px",
                                }}
                              >
                                {process.name}
                              </div>
                            )
                          })}
                        </div>
                        <div className="flex justify-between mt-1 text-xs text-gray-400">
                          <span>0</span>
                          <span>{Math.round(player.currentTime / 4)}</span>
                          <span>{Math.round(player.currentTime / 2)}</span>
                          <span>{Math.round((player.currentTime * 3) / 4)}</span>
                          <span>{Math.round(player.currentTime)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Game Won Modal */}
        <AnimatePresence>
          {gameWon && winner && (
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
                  <Trophy className="text-os-yellow h-12 w-12" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-4 text-center">Competition Complete!</h2>

                <div className="bg-os-darker rounded-md p-4 border border-os-light mb-4">
                  <div className="text-center mb-4">
                    <div className="text-gray-400 text-sm">Winner</div>
                    <div className="text-2xl font-bold" style={{ color: winner.color }}>
                      {winner.name}
                    </div>
                    <div className="text-sm text-gray-400">using {getAlgorithmName(winner.algorithm)}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-gray-400 text-sm">Score</div>
                      <div className="text-xl font-bold text-os-green">{Math.round(winner.score)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-400 text-sm">CPU Utilization</div>
                      <div className="text-xl font-bold text-os-blue">{winner.cpuUtilization.toFixed(2)}%</div>
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
                    }}
                  >
                    Back to Levels
                  </button>

                  {currentLevel < levels.length && (
                    <button
                      className="bg-os-green text-white py-2 px-4 rounded-md hover:bg-green-600 transition-colors"
                      onClick={() => {
                        setCurrentLevel((prev) => prev + 1)
                        setGameStarted(false)
                        if (gameLoopRef.current) {
                          cancelAnimationFrame(gameLoopRef.current)
                        }
                        setTimeout(initializeGame, 100)
                      }}
                    >
                      Next Level
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
                  The competition ended before all processes were completed. Let's see how you did!
                </p>

                <div className="bg-os-darker rounded-md p-4 border border-os-light mb-4">
                  <div className="grid grid-cols-2 gap-4">
                    {players.map((player) => (
                      <div key={player.id} className="text-center">
                        <div className="text-gray-400 text-sm">{player.name}</div>
                        <div className="text-xl font-bold" style={{ color: player.color }}>
                          {Math.round(player.score)}
                        </div>
                      </div>
                    ))}
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
                    }}
                  >
                    Back to Levels
                  </button>

                  <button
                    className="bg-os-green text-white py-2 px-4 rounded-md hover:bg-green-600 transition-colors"
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
                    <h3 className="text-lg font-bold text-os-green mb-1">Objective</h3>
                    <p className="text-gray-300 text-sm">
                      Compete against an opponent using different CPU scheduling algorithms. The player with the best
                      performance metrics wins!
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-os-blue mb-1">Scheduling Algorithms</h3>
                    <ul className="text-gray-300 text-sm list-disc pl-5 space-y-1">
                      <li>
                        <span className="font-bold">FCFS:</span> First-Come, First-Served - processes are executed in
                        order of arrival
                      </li>
                      <li>
                        <span className="font-bold">SJF:</span> Shortest Job First - processes with shortest burst time
                        are executed first
                      </li>
                      <li>
                        <span className="font-bold">Priority:</span> Processes with higher priority (lower number) are
                        executed first
                      </li>
                      <li>
                        <span className="font-bold">RR:</span> Round Robin - each process gets a time quantum before
                        being preempted
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-os-yellow mb-1">Performance Metrics</h3>
                    <ul className="text-gray-300 text-sm list-disc pl-5 space-y-1">
                      <li>
                        <span className="font-bold">Waiting Time:</span> Time a process spends waiting in the ready
                        queue
                      </li>
                      <li>
                        <span className="font-bold">Turnaround Time:</span> Total time from arrival to completion
                      </li>
                      <li>
                        <span className="font-bold">Response Time:</span> Time from arrival to first execution
                      </li>
                      <li>
                        <span className="font-bold">CPU Utilization:</span> Percentage of time the CPU is busy
                      </li>
                    </ul>
                  </div>
                </div>

                <button
                  className="w-full bg-os-green text-white py-2 px-4 rounded-md hover:bg-green-600 transition-colors"
                  onClick={() => setShowTutorial(false)}
                >
                  Got it!
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
