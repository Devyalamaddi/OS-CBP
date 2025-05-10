"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { useStore } from "@/lib/store"
import { Clock, Settings, Play, Pause, RotateCcw, HelpCircle } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { EnhancedGanttChart } from "./enhanced-gantt-chart"

// Algorithm descriptions for tooltips
const algorithmDescriptions = {
  FCFS: "First-Come, First-Served: Processes are executed in the order they arrive",
  SJF: "Shortest Job First: Process with the shortest burst time is executed first",
  RR: "Round Robin: Each process gets a small unit of CPU time (time quantum), then is preempted",
  Priority: "Priority Scheduling: Process with the highest priority is executed first",
}

export function CPUScheduler() {
  const {
    processes,
    simulation,
    setAlgorithm,
    setTimeQuantum,
    startSimulation,
    pauseSimulation,
    resetSimulation,
    updateProcessState,
  } = useStore()

  const [readyQueue, setReadyQueue] = useState<string[]>([])
  const [runningProcess, setRunningProcess] = useState<string | null>(null)
  const [currentQuantum, setCurrentQuantum] = useState(0)
  const [isSchedulingModalOpen, setIsSchedulingModalOpen] = useState(false)
  const [simulationSpeed, setSimulationSpeed] = useState(1) // Default speed

  // Update ready queue based on algorithm
  useEffect(() => {
    if (!simulation.isRunning) return

    const readyProcesses = processes.filter((p) => p.state === "ready").map((p) => p.id)

    let sortedQueue: string[] = []

    switch (simulation.algorithm) {
      case "FCFS":
        sortedQueue = processes
          .filter((p) => readyProcesses.includes(p.id))
          .sort((a, b) => a.arrivalTime - b.arrivalTime)
          .map((p) => p.id)
        break

      case "SJF":
        sortedQueue = processes
          .filter((p) => readyProcesses.includes(p.id))
          .sort((a, b) =>
            simulation.schedulingMode === "preemptive"
              ? (a.remainingTime || 0) - (b.remainingTime || 0)
              : a.burstTime - b.burstTime
          )
          .map((p) => p.id)
        break

      case "Priority":
        sortedQueue = processes
          .filter((p) => readyProcesses.includes(p.id))
          .sort((a, b) => b.priority - a.priority)
          .map((p) => p.id)
        break

      case "RR":
        // Round Robin queue update (only add new ready processes)
        const newQueue = [...readyQueue]
        readyProcesses.forEach((id) => {
          if (!newQueue.includes(id)) {
            newQueue.push(id)
          }
        })
        sortedQueue = newQueue
        break
    }

    // Only update if queue actually changed (prevents re-renders)
    if (JSON.stringify(sortedQueue) !== JSON.stringify(readyQueue)) {
      setReadyQueue(sortedQueue)
    }
  }, [
    processes,
    simulation.algorithm,
    simulation.schedulingMode,
    simulation.isRunning,
    simulationSpeed,
  ])

  // CPU scheduling simulation
  useEffect(() => {
    if (!simulation.isRunning) return

    const interval = setInterval(() => {
      const { algorithm, schedulingMode } = simulation

      // If there's a running process
      if (runningProcess) {
        const process = processes.find((p) => p.id === runningProcess)

        // If process is no longer running or doesn't exist, clear it
        if (!process || process.state !== "running") {
          setRunningProcess(null)
          setCurrentQuantum(0)
          return
        }

        // Update remaining time
        if (process.remainingTime !== undefined) {
          const newRemainingTime = Math.max(0, process.remainingTime - 0.1)

          // Update process in store
          useStore.setState((state) => ({
            processes: state.processes.map((p) =>
              p.id === process.id ? { ...p, remainingTime: newRemainingTime } : p,
            ),
          }))

          // If process is completed
          if (newRemainingTime <= 0) {
            updateProcessState(process.id, "terminated")
            setRunningProcess(null)
            setCurrentQuantum(0)
            return
          }
        }

        // For Round Robin, check if time quantum is exceeded
        if (algorithm === "RR") {
          if (currentQuantum >= simulation.timeQuantum) {
            // Preempt the process
            updateProcessState(runningProcess, "ready")
            setRunningProcess(null)
            setCurrentQuantum(0)

            // Move to the end of the queue
            setReadyQueue((prev) => {
              const newQueue = [...prev]
              newQueue.push(runningProcess)
              return newQueue
            })
          } else {
            // Increment quantum counter
            setCurrentQuantum((prev) => prev + 1)
          }
        }
        // For Preemptive Priority, check if a higher priority process is ready
        else if (algorithm === "Priority" && schedulingMode === "preemptive") {
          const highestPriorityReady = processes
            .filter((p) => p.state === "ready")
            .sort((a, b) => b.priority - a.priority)[0]

          if (highestPriorityReady && highestPriorityReady.priority > process.priority) {
            // Preempt the running process
            updateProcessState(runningProcess, "ready")
            setRunningProcess(null)
            setCurrentQuantum(0)
          }
        }
        // For Preemptive SJF (SRTF), check if a process with shorter remaining time is ready
        else if (algorithm === "SJF" && schedulingMode === "preemptive") {
          const shortestJobReady = processes
            .filter((p) => p.state === "ready")
            .sort((a, b) => (a.remainingTime || 0) - (b.remainingTime || 0))[0]

          if (shortestJobReady && (shortestJobReady.remainingTime || 0) < (process.remainingTime || 0)) {
            // Preempt the running process
            updateProcessState(runningProcess, "ready")
            setRunningProcess(null)
            setCurrentQuantum(0)
          }
        }
      }
      // If there's no running process, get the next one from the queue
      else if (readyQueue.length > 0) {
        const nextProcess = readyQueue[0]

        // Remove from ready queue
        setReadyQueue((prev) => prev.slice(1))

        // Set as running
        updateProcessState(nextProcess, "running")
        setRunningProcess(nextProcess)
        setCurrentQuantum(1)
      }
    }, 100) // Run more frequently for smoother updates

    return () => clearInterval(interval)
  }, [
    processes,
    readyQueue,
    runningProcess,
    simulation.algorithm,
    simulation.schedulingMode,
    simulation.currentTime,
    simulation.isRunning,
    simulation.speed,
    simulation.timeQuantum,
    currentQuantum,
    updateProcessState,
    simulationSpeed,
  ])

  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-os-dark rounded-lg border border-os-light p-4 shadow-lg"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">CPU Scheduler</h2>
          <div className="flex space-x-2">
            <button
              onClick={simulation.isRunning ? pauseSimulation : () => setIsSchedulingModalOpen(true)}
              className={`${
                simulation.isRunning ? "bg-os-yellow" : "bg-os-green"
              } text-white p-2 rounded-md hover:opacity-90 transition-colors`}
            >
              {simulation.isRunning ? <Pause size={16} /> : <Play size={16} />}
            </button>
            <button
              onClick={resetSimulation}
              className="bg-os-red text-white p-2 rounded-md hover:opacity-90 transition-colors"
            >
              <RotateCcw size={16} />
            </button>
          </div>
        </div>

        {/* Algorithm Selection */}
        <div className="bg-os-darker rounded-md border border-os-light p-3 mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-gray-300 flex items-center">
              <Settings className="mr-2 h-4 w-4 text-os-blue" />
              Scheduling Algorithm
            </h3>
            <Tooltip>
              <TooltipTrigger>
                <HelpCircle size={16} className="text-gray-500" />
              </TooltipTrigger>
              <TooltipContent>
                <p>{algorithmDescriptions[simulation.algorithm]}</p>
                {simulation.algorithm !== "FCFS" && simulation.algorithm !== "RR" && (
                  <p className="text-xs mt-1">
                    Mode: {simulation.schedulingMode === "preemptive" ? "Preemptive" : "Non-preemptive"}
                  </p>
                )}
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={() => setAlgorithm("FCFS")}
              className={`text-xs py-1 px-2 rounded-md ${
                simulation.algorithm === "FCFS"
                  ? "bg-os-blue text-white"
                  : "bg-os-light text-gray-300 hover:bg-os-lighter"
              }`}
            >
              FCFS
            </button>
            <button
              onClick={() => setAlgorithm("SJF")}
              className={`text-xs py-1 px-2 rounded-md ${
                simulation.algorithm === "SJF"
                  ? "bg-os-blue text-white"
                  : "bg-os-light text-gray-300 hover:bg-os-lighter"
              }`}
            >
              SJF
            </button>
            <button
              onClick={() => setAlgorithm("Priority")}
              className={`text-xs py-1 px-2 rounded-md ${
                simulation.algorithm === "Priority"
                  ? "bg-os-blue text-white"
                  : "bg-os-light text-gray-300 hover:bg-os-lighter"
              }`}
            >
              Priority
            </button>
            <button
              onClick={() => setAlgorithm("RR")}
              className={`text-xs py-1 px-2 rounded-md ${
                simulation.algorithm === "RR"
                  ? "bg-os-blue text-white"
                  : "bg-os-light text-gray-300 hover:bg-os-lighter"
              }`}
            >
              Round Robin
            </button>
          </div>

          {/* Time Quantum (only for Round Robin) */}
          {simulation.algorithm === "RR" && (
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-gray-400">Time Quantum</label>
                <span className="text-xs font-mono text-os-blue">{simulation.timeQuantum}</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={simulation.timeQuantum}
                onChange={(e) => setTimeQuantum(Number.parseInt(e.target.value))}
                className="w-full h-2 bg-os-light rounded-lg appearance-none cursor-pointer"
              />
            </div>
          )}
        </div>

        {/* Process Queue Visualization */}
        <div className="bg-os-darker rounded-md border border-os-light p-3 mb-4">
          <h3 className="text-sm font-bold text-gray-300 mb-2 flex items-center">
            <Clock className="mr-2 h-4 w-4 text-os-yellow" />
            Ready Queue
          </h3>

          <div className="flex items-center space-x-2 overflow-x-auto pb-2">
            {readyQueue.length === 0 ? (
              <div className="text-gray-500 text-sm py-2 px-4">Queue is empty</div>
            ) : (
              readyQueue.map((processId, index) => {
                const process = processes.find((p) => p.id === processId)
                if (!process) return null

                return (
                  <motion.div
                    key={processId}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex-shrink-0 rounded-md border border-gray-700 p-2 flex flex-col items-center"
                    style={{ backgroundColor: process.color + "33" }}
                  >
                    <div className="w-4 h-4 rounded-full mb-1" style={{ backgroundColor: process.color }} />
                    <span className="text-xs text-white">{process.name}</span>
                    <div className="text-xs text-gray-400 flex flex-col items-center">
                      <span>BT: {process.burstTime}</span>
                      {simulation.algorithm === "Priority" && <span>P: {process.priority}</span>}
                    </div>
                  </motion.div>
                )
              })
            )}
          </div>
        </div>

        
      </motion.div>
    </TooltipProvider>
  )
}
