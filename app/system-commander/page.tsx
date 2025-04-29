"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import {
  Home,
  ArrowLeft,
  Terminal,
  Shield,
  Cpu,
  Database,
  Activity,
  AlertTriangle,
  Zap,
  Trash2,
  Play,
  Pause,
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// Types
type Process = {
  id: string
  name: string
  state: "new" | "ready" | "running" | "waiting" | "terminated"
  priority: number
  burstTime: number
  remainingTime: number
  resources: string[]
  color: string
}

type Resource = {
  id: string
  name: string
  total: number
  available: number
  allocated: Record<string, number>
}

type PowerUp = {
  id: string
  name: string
  description: string
  icon: JSX.Element
  active: boolean
  cooldown: number
  effect: () => void
}

export default function SystemCommanderPage() {
  const [participants, setParticipants] = useState<number>(2)
  const [currentLevel, setCurrentLevel] = useState<number>(1)
  const [isLoading, setIsLoading] = useState(true)
  const [gameStarted, setGameStarted] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [score, setScore] = useState(0)
  const [time, setTime] = useState(0)
  const [cpuUtilization, setCpuUtilization] = useState(0)
  const [memoryUsage, setMemoryUsage] = useState(0)
  const [deadlockDetected, setDeadlockDetected] = useState(false)
  const [deadlocksAvoided, setDeadlocksAvoided] = useState(0)
  const [processes, setProcesses] = useState<Process[]>([])
  const [resources, setResources] = useState<Resource[]>([])
  const [powerUps, setPowerUps] = useState<PowerUp[]>([])
  const [selectedProcess, setSelectedProcess] = useState<string | null>(null)
  const [selectedResource, setSelectedResource] = useState<string | null>(null)
  const [gameSpeed, setGameSpeed] = useState(1)
  const [paused, setPaused] = useState(false)
  const [showTutorial, setShowTutorial] = useState(true)

  const gameLoopRef = useRef<number | null>(null)

  // Level configurations
  const levels = [
    {
      id: 1,
      name: "Smooth Boot",
      description: "3 processes, 2 resources, no deadlock risk. Focus on proper allocation.",
      icon: <Terminal className="h-6 w-6 text-os-blue" />,
      color: "os-blue",
      processes: 3,
      resources: 2,
      deadlockRisk: "low",
      timeLimit: 120, // seconds
    },
    {
      id: 2,
      name: "Memory Crunch",
      description: "4 processes, 3 resources, limited RAM. Introduce a possibility of unsafe states.",
      icon: <Database className="h-6 w-6 text-os-purple" />,
      color: "os-purple",
      processes: 4,
      resources: 3,
      deadlockRisk: "medium",
      timeLimit: 180,
    },
    {
      id: 3,
      name: "CPU Spike",
      description: "Sudden burst of CPU-heavy processes. Balance scheduling and resource assignment.",
      icon: <Cpu className="h-6 w-6 text-os-green" />,
      color: "os-green",
      processes: 5,
      resources: 3,
      deadlockRisk: "medium",
      timeLimit: 240,
    },
    {
      id: 4,
      name: "Multi-thread Madness",
      description: "Introduce multi-threaded processes. Keep the system stable under concurrency.",
      icon: <Activity className="h-6 w-6 text-os-yellow" />,
      color: "os-yellow",
      processes: 6,
      resources: 4,
      deadlockRisk: "high",
      timeLimit: 300,
    },
    {
      id: 5,
      name: "Hacker Attack",
      description: "Handle misbehaving processes (random resource hoarding) and prevent deadlocks.",
      icon: <Shield className="h-6 w-6 text-os-red" />,
      color: "os-red",
      processes: 7,
      resources: 5,
      deadlockRisk: "very high",
      timeLimit: 360,
    },
  ]

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

  // Resource types
  const resourceTypes = [
    { name: "CPU", icon: <Cpu className="h-4 w-4" /> },
    { name: "Memory", icon: <Database className="h-4 w-4" /> },
    { name: "Disk", icon: <Activity className="h-4 w-4" /> },
    { name: "Network", icon: <Activity className="h-4 w-4" /> },
    { name: "GPU", icon: <Cpu className="h-4 w-4" /> },
  ]

  useEffect(() => {
    // Get participants from localStorage
    const storedParticipants = localStorage.getItem("System Commander-participants")
    if (storedParticipants) {
      setParticipants(Number.parseInt(storedParticipants))
    }

    setIsLoading(false)
  }, [])

  // Initialize game
  const initializeGame = () => {
    const level = levels[currentLevel - 1]

    // Create processes
    const newProcesses: Process[] = []
    for (let i = 0; i < level.processes; i++) {
      newProcesses.push({
        id: `p-${i}`,
        name: `Process ${i + 1}`,
        state: i < 2 ? "ready" : "new",
        priority: Math.floor(Math.random() * 10) + 1,
        burstTime: Math.floor(Math.random() * 10) + 5,
        remainingTime: Math.floor(Math.random() * 10) + 5,
        resources: [],
        color: processColors[i % processColors.length],
      })
    }

    // Create resources
    const newResources: Resource[] = []
    for (let i = 0; i < level.resources; i++) {
      const resourceType = resourceTypes[i % resourceTypes.length]
      newResources.push({
        id: `r-${i}`,
        name: resourceType.name,
        total: Math.floor(Math.random() * 5) + 3,
        available: Math.floor(Math.random() * 5) + 3,
        allocated: {},
      })
    }

    // Create power-ups
    const newPowerUps: PowerUp[] = [
      {
        id: "priority-boost",
        name: "Priority Boost",
        description: "Temporarily increases priority of selected process",
        icon: <Zap className="h-4 w-4 text-os-yellow" />,
        active: true,
        cooldown: 0,
        effect: () => {
          if (selectedProcess) {
            setProcesses((prev) => prev.map((p) => (p.id === selectedProcess ? { ...p, priority: p.priority + 3 } : p)))
          }
        },
      },
      {
        id: "memory-cleanup",
        name: "Memory Cleanup",
        description: "Frees up blocked resources",
        icon: <Trash2 className="h-4 w-4 text-os-green" />,
        active: true,
        cooldown: 0,
        effect: () => {
          // Free up some resources
          setResources((prev) =>
            prev.map((r) => ({
              ...r,
              available: Math.min(r.total, r.available + Math.floor(r.total * 0.3)),
            })),
          )
        },
      },
    ]

    setProcesses(newProcesses)
    setResources(newResources)
    setPowerUps(newPowerUps)
    setScore(0)
    setTime(0)
    setCpuUtilization(0)
    setMemoryUsage(0)
    setDeadlockDetected(false)
    setDeadlocksAvoided(0)
    setGameStarted(true)
    setGameOver(false)
    setPaused(false)
    setShowTutorial(true)
  }

  // Game loop
  useEffect(() => {
    if (!gameStarted || paused || gameOver) return

    const level = levels[currentLevel - 1]

    const gameLoop = () => {
      // Update time
      setTime((prev) => {
        const newTime = prev + 0.1 * gameSpeed

        // Check if time limit reached
        if (newTime >= level.timeLimit) {
          setGameOver(true)
          return prev
        }

        return newTime
      })

      // Update processes
      setProcesses((prev) => {
        const updatedProcesses = [...prev]

        // Randomly change process states
        updatedProcesses.forEach((process) => {
          const rand = Math.random()

          if (process.state === "new" && rand > 0.95) {
            process.state = "ready"
          } else if (process.state === "ready" && rand > 0.9) {
            process.state = "running"
          } else if (process.state === "running") {
            process.remainingTime -= 0.1 * gameSpeed

            if (process.remainingTime <= 0) {
              process.state = "terminated"

              // Release resources
              process.resources.forEach((resourceId) => {
                setResources((resources) =>
                  resources.map((r) => {
                    if (r.id === resourceId) {
                      const allocated = r.allocated[process.id] || 0
                      const newAllocated = { ...r.allocated }
                      delete newAllocated[process.id]

                      return {
                        ...r,
                        available: r.available + allocated,
                        allocated: newAllocated,
                      }
                    }
                    return r
                  }),
                )
              })

              // Clear resources
              process.resources = []
            } else if (rand > 0.9) {
              process.state = "waiting"
            }
          } else if (process.state === "waiting" && rand > 0.8) {
            process.state = "ready"
          }
        })

        // Randomly create new processes in higher levels
        if (currentLevel >= 3 && Math.random() > 0.98) {
          const id = `p-${Date.now()}`
          updatedProcesses.push({
            id,
            name: `Process ${updatedProcesses.length + 1}`,
            state: "new",
            priority: Math.floor(Math.random() * 10) + 1,
            burstTime: Math.floor(Math.random() * 10) + 5,
            remainingTime: Math.floor(Math.random() * 10) + 5,
            resources: [],
            color: processColors[updatedProcesses.length % processColors.length],
          })
        }

        return updatedProcesses
      })

      // Update CPU utilization
      setCpuUtilization((prev) => {
        const runningProcesses = processes.filter((p) => p.state === "running").length
        const totalProcesses = processes.filter((p) => p.state !== "terminated").length

        if (totalProcesses === 0) return 0

        const utilization = (runningProcesses / totalProcesses) * 100
        return utilization
      })

      // Update memory usage
      setMemoryUsage((prev) => {
        const totalMemory = resources.reduce((acc, r) => acc + r.total, 0)
        const usedMemory = resources.reduce((acc, r) => acc + (r.total - r.available), 0)

        if (totalMemory === 0) return 0

        const usage = (usedMemory / totalMemory) * 100
        return usage
      })

      // Check for deadlocks
      const waitingProcesses = processes.filter((p) => p.state === "waiting")
      const resourcesWithNoAvailable = resources.filter((r) => r.available === 0)

      if (waitingProcesses.length > 0 && resourcesWithNoAvailable.length > 0) {
        // Simple deadlock detection - if there are waiting processes and no available resources
        const newDeadlockDetected = detectDeadlock(waitingProcesses, resourcesWithNoAvailable)

        if (newDeadlockDetected && !deadlockDetected) {
          setDeadlockDetected(true)

          // Penalty for deadlock
          setScore((prev) => Math.max(0, prev - 50))
        } else if (!newDeadlockDetected && deadlockDetected) {
          setDeadlockDetected(false)
          setDeadlocksAvoided((prev) => prev + 1)

          // Bonus for resolving deadlock
          setScore((prev) => prev + 25)
        }
      } else {
        setDeadlockDetected(false)
      }

      // Update score
      setScore((prev) => {
        // Base score on CPU utilization and memory efficiency
        const cpuScore = cpuUtilization * 0.1
        const memoryScore = (100 - memoryUsage) * 0.05
        const completedProcesses = processes.filter((p) => p.state === "terminated").length * 5

        return Math.floor(prev + cpuScore + memoryScore + completedProcesses)
      })

      // Update power-ups cooldown
      setPowerUps((prev) =>
        prev.map((p) => ({
          ...p,
          cooldown: Math.max(0, p.cooldown - 0.1 * gameSpeed),
          active: p.cooldown <= 0,
        })),
      )

      gameLoopRef.current = requestAnimationFrame(gameLoop)
    }

    gameLoopRef.current = requestAnimationFrame(gameLoop)

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current)
      }
    }
  }, [
    gameStarted,
    paused,
    gameOver,
    gameSpeed,
    currentLevel,
    processes,
    resources,
    cpuUtilization,
    memoryUsage,
    deadlockDetected,
  ])

  // Detect deadlock function
  const detectDeadlock = (waitingProcesses: Process[], resourcesWithNoAvailable: Resource[]) => {
    // Simple deadlock detection algorithm
    // Check if there's a cycle in the resource allocation graph

    // For each waiting process, check if it's waiting for a resource that's fully allocated
    for (const process of waitingProcesses) {
      // If the process has no resources, it's not part of a deadlock
      if (process.resources.length === 0) continue

      // Check if any of the resources the process is waiting for is fully allocated
      const isWaitingForFullyAllocatedResource = process.resources.some((resourceId) =>
        resourcesWithNoAvailable.some((r) => r.id === resourceId),
      )

      if (isWaitingForFullyAllocatedResource) {
        return true
      }
    }

    return false
  }

  // Allocate resource to process
  const allocateResource = (processId: string, resourceId: string) => {
    // Check if resource is available
    const resource = resources.find((r) => r.id === resourceId)
    if (!resource || resource.available <= 0) return

    // Allocate resource
    setResources((prev) =>
      prev.map((r) => {
        if (r.id === resourceId) {
          const allocated = r.allocated[processId] || 0

          return {
            ...r,
            available: r.available - 1,
            allocated: {
              ...r.allocated,
              [processId]: allocated + 1,
            },
          }
        }
        return r
      }),
    )

    // Update process
    setProcesses((prev) =>
      prev.map((p) => {
        if (p.id === processId) {
          return {
            ...p,
            resources: [...p.resources, resourceId],
          }
        }
        return p
      }),
    )

    // Bonus for allocation
    setScore((prev) => prev + 5)
  }

  // Release resource from process
  const releaseResource = (processId: string, resourceId: string) => {
    // Check if process has the resource
    const process = processes.find((p) => p.id === processId)
    if (!process || !process.resources.includes(resourceId)) return

    // Release resource
    setResources((prev) =>
      prev.map((r) => {
        if (r.id === resourceId) {
          const allocated = r.allocated[processId] || 0
          const newAllocated = { ...r.allocated }

          if (allocated > 1) {
            newAllocated[processId] = allocated - 1
          } else {
            delete newAllocated[processId]
          }

          return {
            ...r,
            available: r.available + 1,
            allocated: newAllocated,
          }
        }
        return r
      }),
    )

    // Update process
    setProcesses((prev) =>
      prev.map((p) => {
        if (p.id === processId) {
          return {
            ...p,
            resources: p.resources.filter((id) => id !== resourceId),
          }
        }
        return p
      }),
    )
  }

  // Use power-up
  const usePowerUp = (powerUpId: string) => {
    const powerUp = powerUps.find((p) => p.id === powerUpId)
    if (!powerUp || !powerUp.active) return

    // Use power-up effect
    powerUp.effect()

    // Set cooldown
    setPowerUps((prev) =>
      prev.map((p) => {
        if (p.id === powerUpId) {
          return {
            ...p,
            active: false,
            cooldown: 10, // 10 seconds cooldown
          }
        }
        return p
      }),
    )
  }

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-os-darker flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-os-blue"></div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-os-darker flex flex-col">
      {/* Header */}
      <header className="bg-os-dark border-b border-os-light p-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <Link href="/simulation" className="text-white hover:text-os-blue transition-colors mr-4">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl font-bold text-white flex items-center">
              <Terminal className="mr-2 text-os-blue" />
              System Commander
            </h1>
          </div>
          <nav className="flex space-x-4">
            <Link href="/" className="text-white hover:text-os-blue transition-colors flex items-center">
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
              <h2 className="text-2xl font-bold text-white mb-2">Select a Level</h2>
              <p className="text-gray-400">
                Step into the role of an OS kernel! Take control of a virtual computer system, allocate resources, and
                prevent deadlocks.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {levels.map((level) => (
                <motion.div
                  key={level.id}
                  whileHover={{ scale: 1.03 }}
                  className={`bg-os-darker border border-${level.color}/30 rounded-lg p-4 cursor-pointer`}
                  onClick={() => setCurrentLevel(level.id)}
                >
                  <div className="flex items-center mb-2">
                    {level.icon}
                    <h3 className="text-lg font-bold text-white ml-2">
                      Level {level.id}: {level.name}
                    </h3>
                  </div>
                  <p className="text-gray-300 text-sm">{level.description}</p>
                  <div className="mt-3 flex justify-between items-center text-xs text-gray-400">
                    <span>Time: {formatTime(level.timeLimit)}</span>
                    <span>Risk: {level.deadlockRisk}</span>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="flex justify-center">
              <button
                className="bg-os-blue hover:bg-blue-600 text-white py-3 px-8 rounded-md transition-colors text-lg font-bold"
                onClick={initializeGame}
              >
                Start Level {currentLevel}
              </button>
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left Column - System Dashboard */}
            <div className="space-y-4">
              {/* System Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-os-dark rounded-lg border border-os-light p-4 shadow-lg"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white">System Dashboard</h2>
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
                  {/* CPU Utilization */}
                  <div className="bg-os-darker rounded-md p-3 border border-os-light">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <Cpu className="mr-2 text-os-blue h-4 w-4" />
                        <span className="text-sm text-gray-300">CPU</span>
                      </div>
                      <span className="text-sm font-mono text-os-blue">{cpuUtilization.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-os-light rounded-full h-2">
                      <motion.div className="bg-os-blue h-2 rounded-full" style={{ width: `${cpuUtilization}%` }} />
                    </div>
                  </div>

                  {/* Memory Usage */}
                  <div className="bg-os-darker rounded-md p-3 border border-os-light">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <Database className="mr-2 text-os-purple h-4 w-4" />
                        <span className="text-sm text-gray-300">Memory</span>
                      </div>
                      <span className="text-sm font-mono text-os-purple">{memoryUsage.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-os-light rounded-full h-2">
                      <motion.div className="bg-os-purple h-2 rounded-full" style={{ width: `${memoryUsage}%` }} />
                    </div>
                  </div>
                </div>

                {/* Score and Stats */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="bg-os-darker rounded-md p-2 border border-os-light flex flex-col items-center justify-center">
                    <span className="text-xs text-gray-400">Score</span>
                    <span className="text-lg font-bold text-os-green">{score}</span>
                  </div>
                  <div className="bg-os-darker rounded-md p-2 border border-os-light flex flex-col items-center justify-center">
                    <span className="text-xs text-gray-400">Level</span>
                    <span className="text-lg font-bold text-os-blue">{currentLevel}</span>
                  </div>
                  <div className="bg-os-darker rounded-md p-2 border border-os-light flex flex-col items-center justify-center">
                    <span className="text-xs text-gray-400">Deadlocks Avoided</span>
                    <span className="text-lg font-bold text-os-yellow">{deadlocksAvoided}</span>
                  </div>
                </div>

                {/* Deadlock Warning */}
                {deadlockDetected && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-red-900/30 border border-red-700 rounded-md p-3 flex items-center"
                  >
                    <AlertTriangle className="text-os-red mr-2 h-5 w-5 animate-pulse" />
                    <div>
                      <h3 className="text-os-red font-bold text-sm">Deadlock Detected!</h3>
                      <p className="text-xs text-gray-300">Resource allocation has created a circular wait condition</p>
                    </div>
                  </motion.div>
                )}

                {/* Power-ups */}
                <div className="mt-4">
                  <h3 className="text-sm font-bold text-gray-300 mb-2">Power-ups</h3>
                  <div className="flex space-x-2">
                    {powerUps.map((powerUp) => (
                      <TooltipProvider key={powerUp.id}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              className={`p-2 rounded-md ${powerUp.active ? "bg-os-blue" : "bg-os-darker"} ${!powerUp.active ? "opacity-50 cursor-not-allowed" : ""}`}
                              onClick={() => usePowerUp(powerUp.id)}
                              disabled={!powerUp.active}
                            >
                              {powerUp.icon}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="font-bold">{powerUp.name}</p>
                            <p className="text-xs">{powerUp.description}</p>
                            {!powerUp.active && (
                              <p className="text-xs text-os-red">Cooldown: {powerUp.cooldown.toFixed(1)}s</p>
                            )}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Resources */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-os-dark rounded-lg border border-os-light p-4 shadow-lg"
              >
                <h2 className="text-xl font-bold text-white mb-4">Resources</h2>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {resources.map((resource) => (
                    <div
                      key={resource.id}
                      className={`bg-os-darker rounded-md p-3 border ${selectedResource === resource.id ? "border-os-blue" : "border-os-light"} cursor-pointer`}
                      onClick={() => setSelectedResource(resource.id === selectedResource ? null : resource.id)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          {resourceTypes.find((t) => t.name === resource.name)?.icon}
                          <span className="text-white ml-2">{resource.name}</span>
                        </div>
                        <span className="text-sm font-mono text-os-green">
                          {resource.available}/{resource.total}
                        </span>
                      </div>
                      <div className="w-full bg-os-light rounded-full h-2 mb-2">
                        <motion.div
                          className="bg-os-green h-2 rounded-full"
                          style={{ width: `${(resource.available / resource.total) * 100}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-400">
                        {Object.keys(resource.allocated).length > 0 ? (
                          <div>
                            <span>Allocated to: </span>
                            {Object.entries(resource.allocated).map(([processId, amount]) => {
                              const process = processes.find((p) => p.id === processId)
                              return process ? (
                                <span
                                  key={processId}
                                  className="inline-block px-1 rounded mr-1 text-white"
                                  style={{ backgroundColor: process.color }}
                                >
                                  {process.name} ({amount})
                                </span>
                              ) : null
                            })}
                          </div>
                        ) : (
                          <span>Not allocated</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Middle Column - Processes */}
            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-os-dark rounded-lg border border-os-light p-4 shadow-lg"
              >
                <h2 className="text-xl font-bold text-white mb-4">Processes</h2>
                <div className="space-y-2 max-h-[calc(100vh-16rem)] overflow-y-auto">
                  {processes.map((process) => (
                    <div
                      key={process.id}
                      className={`bg-os-darker rounded-md p-3 border ${selectedProcess === process.id ? "border-os-blue" : "border-os-light"} cursor-pointer`}
                      onClick={() => setSelectedProcess(process.id === selectedProcess ? null : process.id)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: process.color }} />
                          <span className="text-white">{process.name}</span>
                        </div>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            process.state === "new"
                              ? "bg-os-blue/20 text-os-blue"
                              : process.state === "ready"
                                ? "bg-os-green/20 text-os-green"
                                : process.state === "running"
                                  ? "bg-os-purple/20 text-os-purple"
                                  : process.state === "waiting"
                                    ? "bg-os-yellow/20 text-os-yellow"
                                    : "bg-os-red/20 text-os-red"
                          }`}
                        >
                          {process.state}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mb-2 text-xs text-gray-400">
                        <div>Priority: {process.priority}</div>
                        <div>Burst Time: {process.burstTime.toFixed(1)}s</div>
                        <div>Remaining: {process.remainingTime.toFixed(1)}s</div>
                        <div>Resources: {process.resources.length}</div>
                      </div>
                      {process.state !== "terminated" && (
                        <div className="w-full bg-os-light rounded-full h-2">
                          <motion.div
                            className="bg-os-purple h-2 rounded-full"
                            style={{
                              width: `${((process.burstTime - process.remainingTime) / process.burstTime) * 100}%`,
                            }}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Right Column - Actions */}
            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-os-dark rounded-lg border border-os-light p-4 shadow-lg"
              >
                <h2 className="text-xl font-bold text-white mb-4">Actions</h2>

                {/* Resource Allocation */}
                {selectedProcess && selectedProcess && (
                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-gray-300 mb-2">Allocate Resources</h3>
                    <div className="bg-os-darker rounded-md p-3 border border-os-light">
                      <div className="flex items-center mb-2">
                        <div
                          className="w-3 h-3 rounded-full mr-2"
                          style={{ backgroundColor: processes.find((p) => p.id === selectedProcess)?.color }}
                        />
                        <span className="text-white">{processes.find((p) => p.id === selectedProcess)?.name}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {resources.map((resource) => (
                          <button
                            key={resource.id}
                            className={`text-xs py-1 px-2 rounded-md ${
                              resource.available === 0
                                ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                                : "bg-os-green/20 text-os-green hover:bg-os-green/30"
                            }`}
                            onClick={() => allocateResource(selectedProcess, resource.id)}
                            disabled={resource.available === 0}
                          >
                            Allocate {resource.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Resource Release */}
                {selectedProcess && processes.find((p) => p.id === selectedProcess)?.resources.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-gray-300 mb-2">Release Resources</h3>
                    <div className="bg-os-darker rounded-md p-3 border border-os-light">
                      <div className="grid grid-cols-2 gap-2">
                        {processes
                          .find((p) => p.id === selectedProcess)
                          ?.resources.map((resourceId) => {
                            const resource = resources.find((r) => r.id === resourceId)
                            return resource ? (
                              <button
                                key={resourceId}
                                className="text-xs py-1 px-2 rounded-md bg-os-red/20 text-os-red hover:bg-os-red/30"
                                onClick={() => releaseResource(selectedProcess, resourceId)}
                              >
                                Release {resource.name}
                              </button>
                            ) : null
                          })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Game Controls */}
                <div>
                  <h3 className="text-sm font-bold text-gray-300 mb-2">Game Controls</h3>
                  <div className="bg-os-darker rounded-md p-3 border border-os-light">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-300">Game Speed</span>
                      <span className="text-sm font-mono text-os-blue">{gameSpeed}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="2"
                      step="0.5"
                      value={gameSpeed}
                      onChange={(e) => setGameSpeed(Number(e.target.value))}
                      className="w-full h-2 bg-os-light rounded-lg appearance-none cursor-pointer"
                    />

                    <div className="grid grid-cols-2 gap-2 mt-4">
                      <button
                        className="bg-os-red text-white py-2 px-4 rounded-md hover:bg-red-600 transition-colors"
                        onClick={() => {
                          setGameStarted(false)
                          if (gameLoopRef.current) {
                            cancelAnimationFrame(gameLoopRef.current)
                          }
                        }}
                      >
                        Quit Level
                      </button>
                      <button
                        className={`py-2 px-4 rounded-md ${paused ? "bg-os-green text-white" : "bg-os-yellow text-white"}`}
                        onClick={() => setPaused(!paused)}
                      >
                        {paused ? "Resume" : "Pause"}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        )}

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
                <h2 className="text-2xl font-bold text-white mb-4 text-center">Level Complete!</h2>

                <div className="bg-os-darker rounded-md p-4 border border-os-light mb-4">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-gray-400 text-sm">Score</div>
                      <div className="text-3xl font-bold text-os-green">{score}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-400 text-sm">Level</div>
                      <div className="text-3xl font-bold text-os-blue">{currentLevel}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-gray-400 text-sm">CPU Utilization</div>
                      <div className="text-xl font-bold text-os-purple">{cpuUtilization.toFixed(1)}%</div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-400 text-sm">Deadlocks Avoided</div>
                      <div className="text-xl font-bold text-os-yellow">{deadlocksAvoided}</div>
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
                      className="bg-os-blue text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors"
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
                    <h3 className="text-lg font-bold text-os-blue mb-1">Objective</h3>
                    <p className="text-gray-300 text-sm">
                      Manage system resources efficiently, avoid deadlocks, and maximize CPU utilization to earn points.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-os-green mb-1">Controls</h3>
                    <ul className="text-gray-300 text-sm list-disc pl-5 space-y-1">
                      <li>Click on a process to select it</li>
                      <li>Allocate resources to processes</li>
                      <li>Release resources when no longer needed</li>
                      <li>Use power-ups strategically to overcome challenges</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-os-red mb-1">Watch Out!</h3>
                    <p className="text-gray-300 text-sm">
                      Deadlocks occur when processes are waiting for resources held by other waiting processes. Avoid
                      them to earn more points!
                    </p>
                  </div>
                </div>

                <button
                  className="w-full bg-os-blue text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors"
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
