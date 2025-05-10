"use client"

import { useEffect } from "react"
import Link from "next/link"
import { DashboardPanel } from "@/components/dashboard/dashboard-panel"
import { ProcessLifecycle } from "@/components/process/process-lifecycle"
import { ResourceAllocationGraph } from "@/components/resource/resource-allocation-graph"
import { CPUScheduler } from "@/components/scheduler/cpu-scheduler"
import { useStore } from "@/lib/store"
import { Home, Award, LogOut } from "lucide-react"
import { GameCards } from "@/components/gamification/game-cards"
import { SimulationControls } from "@/components/simulation-controls"

export default function SimulationPage() {
  const { simulation, resetSimulation, updateGameMetrics } = useStore()

  // Reset simulation when component unmounts
  useEffect(() => {
    return () => {
      resetSimulation()
    }
  }, [resetSimulation])

  // Update simulation time and metrics
  useEffect(() => {
    if (!simulation.isRunning) return

    const interval = setInterval(() => {
      const { processes } = useStore.getState()

      // Calculate metrics
      const runningProcesses = processes.filter((p) => p.state === "running").length
      const cpuUtilization = processes.length > 0 ? (runningProcesses / processes.length) * 100 : 0

      // Calculate waiting times for all processes
      const waitingTimes = processes.filter((p) => p.waitingTime !== undefined).map((p) => p.waitingTime || 0)

      const averageWaitingTime =
        waitingTimes.length > 0 ? waitingTimes.reduce((sum, time) => sum + time, 0) / waitingTimes.length : 0

      // Calculate turnaround times for completed processes
      const turnaroundTimes = processes
        .filter((p) => p.state === "terminated" && p.turnaroundTime !== undefined)
        .map((p) => p.turnaroundTime || 0)

      const averageTurnaroundTime =
        turnaroundTimes.length > 0 ? turnaroundTimes.reduce((sum, time) => sum + time, 0) / turnaroundTimes.length : 0

      // Calculate response times
      const responseTimes = processes
        .filter((p) => p.responseTime !== undefined && p.responseTime >= 0)
        .map((p) => p.responseTime || 0)

      const averageResponseTime =
        responseTimes.length > 0 ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length : 0

      // Update simulation state with metrics
      useStore.setState((state) => ({
        simulation: {
          ...state.simulation,
          currentTime: state.simulation.currentTime + 0.1 * state.simulation.speed,
          cpuUtilization,
          averageWaitingTime,
          averageTurnaroundTime,
          averageResponseTime,
        },
      }))
    }, 100)

    return () => clearInterval(interval)
  }, [simulation.isRunning, simulation.speed, updateGameMetrics])

  return (
    <main className="min-h-screen bg-os-darker flex flex-col">
      {/* Header */}
      <header className="bg-os-dark border-b border-os-light p-4 sticky top-0 z-10">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">
            <span className="text-os-blue">OS</span> Simulator
          </h1>
          <nav className="flex space-x-4">
            <Link href="/" className="text-white hover:text-os-blue transition-colors flex items-center">
              <Home className="mr-1" size={16} />
              Home
            </Link>
            <Link href="/leaderboard" className="text-white hover:text-os-blue transition-colors flex items-center">
              <Award className="mr-1" size={16} />
              Leaderboard
            </Link>
            <Link href="/login" className="text-white hover:text-os-blue transition-colors flex items-center">
              <LogOut className="mr-1" size={16} />
              Logout
            </Link>
          </nav>
        </div>
      </header>

      {/* Simulation Grid */}
      <div className="flex-1 container mx-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column */}
        <div className="space-y-4">
          <DashboardPanel />
          <GameCards/>
        </div>

        {/* Middle Column */}
        <div className="space-y-4">
          <ProcessLifecycle />
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          <CPUScheduler />
          <ResourceAllocationGraph />
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-os-dark border-t border-os-light p-4 text-center text-gray-400">
        <p>© 2023 OS Resource Allocation Simulator | Educational Project</p>
      </footer>
    </main>
  )
}
