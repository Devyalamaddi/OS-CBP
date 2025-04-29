import { create } from "zustand"

// Define types for our store
type Process = {
  id: string
  name: string
  state: "new" | "ready" | "running" | "waiting" | "terminated"
  priority: number
  burstTime: number
  arrivalTime: number
  resources: string[]
  color: string
  remainingTime?: number // For preemptive scheduling
  waitingTime?: number // For performance metrics
  turnaroundTime?: number // For performance metrics
  responseTime?: number // For performance metrics
}

type Resource = {
  id: string
  name: string
  total: number
  available: number
  allocated: Record<string, number>
  maximum?: Record<string, number> // For Banker's Algorithm
}

type SchedulingAlgorithm = "FCFS" | "SJF" | "RR" | "Priority"
type SchedulingMode = "preemptive" | "non-preemptive"

type SimulationState = {
  isRunning: boolean
  speed: number
  currentTime: number
  algorithm: SchedulingAlgorithm
  schedulingMode: SchedulingMode
  timeQuantum: number
  score: number
  level: number
  deadlockDetected: boolean
  completedChallenges: string[]
  experience: number
  streak: number
  lastPlayDate: string | null
  cpuUtilization: number
  averageWaitingTime: number
  averageTurnaroundTime: number
  averageResponseTime: number
}

type GameMetrics = {
  levelsCompleted: number
  bestScores: Record<number, number> // level -> score
  attempts: number
  deadlocksAvoided: number
  deadlocksOccurred: number
  mostEfficientAlgorithm: SchedulingAlgorithm | null
}

type Store = {
  processes: Process[]
  resources: Resource[]
  simulation: SimulationState
  gameMetrics: GameMetrics
  // Actions
  addProcess: (process: Omit<Process, "id">) => void
  removeProcess: (id: string) => void
  updateProcessState: (id: string, state: Process["state"]) => void
  allocateResource: (processId: string, resourceId: string, amount: number) => void
  releaseResource: (processId: string, resourceId: string, amount: number) => void
  startSimulation: (mode?: SchedulingMode) => void
  pauseSimulation: () => void
  resetSimulation: () => void
  setAlgorithm: (algorithm: SchedulingAlgorithm) => void
  setSchedulingMode: (mode: SchedulingMode) => void
  setTimeQuantum: (quantum: number) => void
  setSpeed: (speed: number) => void
  setLevel: (level: number) => void
  detectDeadlock: () => boolean
  isSafeState: () => boolean // For Banker's Algorithm
  completeChallenge: (id: string) => void
  addExperience: (amount: number) => void
  calculateScore: () => number
  updateGameMetrics: (metrics: Partial<GameMetrics>) => void
  setMaximumResource: (processId: string, resourceId: string, amount: number) => void
  clearGanttChart: () => void
}

// Process colors
const processColors = [
  "#4FACFE", // Blue
  "#9D50BB", // Purple
  "#43E97B", // Green
  "#FF5E62", // Red
  "#FFDB3A", // Yellow
]

// Create the store
export const useStore = create<Store>((set, get) => ({
  processes: [],
  resources: [],
  simulation: {
    isRunning: false,
    speed: 1,
    currentTime: 0,
    algorithm: "FCFS",
    schedulingMode: "non-preemptive",
    timeQuantum: 2,
    score: 0,
    level: 1,
    deadlockDetected: false,
    completedChallenges: [],
    experience: 0,
    streak: 0,
    lastPlayDate: null,
    cpuUtilization: 0,
    averageWaitingTime: 0,
    averageTurnaroundTime: 0,
    averageResponseTime: 0,
  },
  gameMetrics: {
    levelsCompleted: 0,
    bestScores: {},
    attempts: 0,
    deadlocksAvoided: 0,
    deadlocksOccurred: 0,
    mostEfficientAlgorithm: null,
  },

  // Actions
  addProcess: (process) => {
    const id = `p-${Date.now()}`
    const colorIndex = get().processes.length % processColors.length

    set((state) => {
      // Add process with additional scheduling metrics
      return {
        processes: [
          ...state.processes,
          {
            ...process,
            id,
            color: processColors[colorIndex],
            remainingTime: process.burstTime,
            waitingTime: 0,
            turnaroundTime: 0,
            responseTime: -1, // Will be set when first scheduled
          },
        ],
      }
    })
  },

  removeProcess: (id) => {
    set((state) => ({
      processes: state.processes.filter((p) => p.id !== id),
    }))
  },

  updateProcessState: (id, newState) => {
    set((state) => {
      const currentTime = state.simulation.currentTime

      return {
        processes: state.processes.map((p) => {
          if (p.id === id) {
            const updatedProcess = { ...p, state:newState }

            // Track response time when first scheduled to run
            if (newState === "running" && p.responseTime === -1) {
              updatedProcess.responseTime = currentTime - p.arrivalTime
            }

            // Calculate turnaround time when terminated
            if (newState === "terminated") {
              updatedProcess.turnaroundTime = currentTime - p.arrivalTime
            }

            return updatedProcess
          }
          return p
        }),
      }
    })
  },

  allocateResource: (processId, resourceId, amount) => {
    set((state) => {
      const updatedResources = state.resources.map((r) => {
        if (r.id === resourceId && r.available >= amount) {
          const allocated = r.allocated[processId] || 0
          return {
            ...r,
            available: r.available - amount,
            allocated: {
              ...r.allocated,
              [processId]: allocated + amount,
            },
          }
        }
        return r
      })

      const updatedProcesses = state.processes.map((p) => {
        if (p.id === processId) {
          return {
            ...p,
            resources: [...p.resources, resourceId],
          }
        }
        return p
      })

      // After allocation, check for deadlock
      const deadlockDetected = get().detectDeadlock()

      return {
        resources: updatedResources,
        processes: updatedProcesses,
        simulation: {
          ...state.simulation,
          deadlockDetected,
        },
      }
    })
  },

  releaseResource: (processId, resourceId, amount) => {
    set((state) => {
      const updatedResources = state.resources.map((r) => {
        if (r.id === resourceId) {
          const allocated = r.allocated[processId] || 0
          const amountToRelease = Math.min(allocated, amount)

          const newAllocated = { ...r.allocated }
          newAllocated[processId] = allocated - amountToRelease

          if (newAllocated[processId] === 0) {
            delete newAllocated[processId]
          }

          return {
            ...r,
            available: r.available + amountToRelease,
            allocated: newAllocated,
          }
        }
        return r
      })

      const updatedProcesses = state.processes.map((p) => {
        if (p.id === processId) {
          return {
            ...p,
            resources: p.resources.filter((id) => id !== resourceId),
          }
        }
        return p
      })

      return {
        resources: updatedResources,
        processes: updatedProcesses,
      }
    })
  },

  startSimulation: (mode) => {
    set((state) => {
      // Update game metrics
      const gameMetrics = {
        ...state.gameMetrics,
        attempts: state.gameMetrics.attempts + 1,
      }

      return {
        simulation: {
          ...state.simulation,
          isRunning: true,
          schedulingMode: mode || state.simulation.schedulingMode,
        },
        gameMetrics,
      }
    })
  },

  pauseSimulation: () => {
    set((state) => ({
      simulation: {
        ...state.simulation,
        isRunning: false,
      },
    }))
  },

  resetSimulation: () => {
    set((state) => ({
      processes: [],
      resources: [],
      simulation: {
        ...state.simulation,
        isRunning: false,
        currentTime: 0,
        score: 0,
        deadlockDetected: false,
        cpuUtilization: 0,
        averageWaitingTime: 0,
        averageTurnaroundTime: 0,
        averageResponseTime: 0,
      },
    }))
  },

  setAlgorithm: (algorithm) => {
    set((state) => ({
      simulation: {
        ...state.simulation,
        algorithm,
      },
    }))
  },

  setSchedulingMode: (mode) => {
    set((state) => ({
      simulation: {
        ...state.simulation,
        schedulingMode: mode,
      },
    }))
  },

  setTimeQuantum: (timeQuantum) => {
    set((state) => ({
      simulation: {
        ...state.simulation,
        timeQuantum,
      },
    }))
  },

  setSpeed: (speed) => {
    set((state) => ({
      simulation: {
        ...state.simulation,
        speed,
      },
    }))
  },

  setLevel: (level) => {
    set((state) => ({
      simulation: {
        ...state.simulation,
        level,
      },
    }))
  },

  detectDeadlock: () => {
    // Simple deadlock detection algorithm
    // In a real implementation, this would be more complex
    const { processes, resources } = get()

    // Check if there's a cycle in the resource allocation graph
    // This is a simplified version
    const deadlockDetected = processes.some(
      (p) =>
        p.state === "waiting" &&
        p.resources.some((rId) => {
          const resource = resources.find((r) => r.id === rId)
          return resource && resource.available === 0
        }),
    )

    set((state) => {
      // Update game metrics if deadlock was detected
      let gameMetrics = { ...state.gameMetrics }

      if (deadlockDetected && !state.simulation.deadlockDetected) {
        gameMetrics = {
          ...gameMetrics,
          deadlocksOccurred: gameMetrics.deadlocksOccurred + 1,
        }
      }

      return {
        simulation: {
          ...state.simulation,
          deadlockDetected,
          score: state.calculateScore(),
        },
        gameMetrics,
      }
    })

    return deadlockDetected
  },

  isSafeState: () => {
    // Banker's Algorithm for deadlock avoidance
    const { processes, resources } = get()

    // Make copy of available resources
    const available = {}
    resources.forEach((r) => {
      available[r.id] = r.available
    })

    // Make copy of remaining need for each process
    const need = {}
    processes.forEach((p) => {
      need[p.id] = {}
      resources.forEach((r) => {
        const max = r.maximum?.[p.id] || 0
        const allocated = r.allocated[p.id] || 0
        need[p.id][r.id] = Math.max(0, max - allocated)
      })
    })

    // Find a safe sequence
    const finished = new Set()
    const n = processes.length

    while (finished.size < n) {
      let found = false

      // Find a process that can finish with available resources
      for (const p of processes) {
        if (finished.has(p.id)) continue

        let canFinish = true
        for (const r of resources) {
          if ((need[p.id]?.[r.id] || 0) > (available[r.id] || 0)) {
            canFinish = false
            break
          }
        }

        if (canFinish) {
          // Process can finish, release its resources
          finished.add(p.id)
          found = true

          // Release allocated resources
          resources.forEach((r) => {
            const allocated = r.allocated[p.id] || 0
            available[r.id] = (available[r.id] || 0) + allocated
          })
        }
      }

      // If no process can finish, there's no safe sequence
      if (!found && finished.size < n) {
        return false
      }
    }

    // All processes can finish, state is safe
    return true
  },

  completeChallenge: (id) => {
    set((state) => {
      if (state.simulation.completedChallenges.includes(id)) {
        return state
      }

      // Add experience when completing a challenge
      state.addExperience(100)

      return {
        simulation: {
          ...state.simulation,
          completedChallenges: [...state.simulation.completedChallenges, id],
          score: state.calculateScore(),
        },
      }
    })
  },

  addExperience: (amount) => {
    set((state) => {
      const newExperience = state.simulation.experience + amount

      // Simple leveling system - level up every 500 XP
      const newLevel = Math.floor(newExperience / 500) + 1
      const leveledUp = newLevel > state.simulation.level

      return {
        simulation: {
          ...state.simulation,
          experience: newExperience,
          level: newLevel,
          score: state.calculateScore(),
        },
      }
    })
  },

  calculateScore: () => {
    const state = get()
    const { simulation, processes, resources } = state

    // Get the number of completed processes
    const completedProcesses = processes.filter((p) => p.state === "terminated").length

    // Level multiplier increases with level
    const levelMultiplier = simulation.level * 10

    // Base score based on CPU utilization
    const cpuUtilizationScore = Math.round(simulation.cpuUtilization * levelMultiplier)

    // Penalties and bonuses
    const deadlockPenalty = simulation.deadlockDetected ? -100 * simulation.level : 0

    // Efficiency bonus based on waiting and turnaround times
    const waitingTimeBonus = simulation.averageWaitingTime === 0 ? 0 : Math.round(100 / simulation.averageWaitingTime)
    const turnaroundTimeBonus =
      simulation.averageTurnaroundTime === 0 ? 0 : Math.round(200 / simulation.averageTurnaroundTime)

    // Complexity bonus based on number of processes and resources
    const complexityBonus = processes.length * 5 + resources.length * 10

    // Deadlock avoidance bonus
    const safeStateBonus = state.isSafeState() ? 50 * simulation.level : 0

    // Calculate total score
    const totalScore =
      cpuUtilizationScore +
      deadlockPenalty +
      waitingTimeBonus +
      turnaroundTimeBonus +
      complexityBonus +
      safeStateBonus +
      completedProcesses * 25

    return Math.max(0, totalScore)
  },

  updateGameMetrics: (metrics) => {
    set((state) => {
      // Update best score if current score is higher
      const bestScores = { ...state.gameMetrics.bestScores }
      const currentLevel = state.simulation.level
      const currentScore = state.simulation.score

      if (!bestScores[currentLevel] || currentScore > bestScores[currentLevel]) {
        bestScores[currentLevel] = currentScore
      }

      return {
        gameMetrics: {
          ...state.gameMetrics,
          ...metrics,
          bestScores,
        },
      }
    })
  },

  setMaximumResource: (processId, resourceId, amount) => {
    set((state) => {
      const updatedResources = state.resources.map((r) => {
        if (r.id === resourceId) {
          return {
            ...r,
            maximum: {
              ...r.maximum,
              [processId]: amount,
            },
          }
        }
        return r
      })

      return {
        resources: updatedResources,
      }
    })
  },

  clearGanttChart: () => {
    // This is a trigger for the Gantt Chart component to clear its data
    // We don't need to modify any state here, just trigger a re-render
    set((state) => ({ ...state }))
  },
}))
