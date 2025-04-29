"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { useStore } from "@/lib/store"
import { Activity, Cpu, AlertTriangle, Clock, Database } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function DashboardPanel() {
  const { processes, resources, simulation, detectDeadlock } = useStore()

  const [cpuUtilization, setCpuUtilization] = useState(0)
  const [memoryUsage, setMemoryUsage] = useState(0)

  // Calculate CPU utilization based on running processes
  useEffect(() => {
    if (processes.length === 0) {
      setCpuUtilization(0)
      return
    }

    const runningProcesses = processes.filter((p) => p.state === "running").length
    const readyProcesses = processes.filter((p) => p.state === "ready").length

    // Simple calculation for demo purposes
    const utilization = (runningProcesses / processes.length) * 100
    setCpuUtilization(Math.min(utilization, 100))

    // Calculate memory usage based on allocated resources
    const totalMemory = resources.reduce((acc, r) => acc + r.total, 0)
    const usedMemory = resources.reduce((acc, r) => acc + (r.total - r.available), 0)

    if (totalMemory === 0) {
      setMemoryUsage(0)
      return
    }

    setMemoryUsage((usedMemory / totalMemory) * 100)
  }, [processes, resources])

  // Check for deadlocks periodically
  useEffect(() => {
    if (simulation.isRunning) {
      const interval = setInterval(() => {
        detectDeadlock()
      }, 2000)

      return () => clearInterval(interval)
    }
  }, [simulation.isRunning, detectDeadlock])

  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-os-dark rounded-lg border border-os-light p-4 shadow-lg"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center">
            <Activity className="mr-2 text-os-blue" />
            System Monitor
          </h2>
          <div className="flex items-center">
            <Clock className="mr-2 text-os-yellow" />
            <span className="text-os-yellow font-mono">T: {simulation.currentTime.toFixed(1)}s</span>
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
              <motion.div
                className="bg-os-blue h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${cpuUtilization}%` }}
                transition={{ duration: 0.5 }}
              />
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
              <motion.div
                className="bg-os-purple h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${memoryUsage}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        </div>

        {/* Process Stats */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <Tooltip>
            <TooltipTrigger>
              <div className="bg-os-darker rounded-md p-2 border border-os-light flex flex-col items-center justify-center">
                <span className="text-xs text-gray-400">Ready</span>
                <span className="text-lg font-bold text-os-green">
                  {processes.filter((p) => p.state === "ready").length}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Processes ready to be executed</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger>
              <div className="bg-os-darker rounded-md p-2 border border-os-light flex flex-col items-center justify-center">
                <span className="text-xs text-gray-400">Running</span>
                <span className="text-lg font-bold text-os-blue">
                  {processes.filter((p) => p.state === "running").length}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Processes currently executing</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger>
              <div className="bg-os-darker rounded-md p-2 border border-os-light flex flex-col items-center justify-center">
                <span className="text-xs text-gray-400">Waiting</span>
                <span className="text-lg font-bold text-os-yellow">
                  {processes.filter((p) => p.state === "waiting").length}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Processes waiting for resources</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Deadlock Warning */}
        {simulation.deadlockDetected && (
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
      </motion.div>
    </TooltipProvider>
  )
}
