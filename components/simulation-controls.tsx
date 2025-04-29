"use client"

import { motion } from "framer-motion"
import { useStore } from "@/lib/store"
import { Play, Pause, RotateCcw, FastForward, Clock, Trophy } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function SimulationControls() {
  const { simulation, startSimulation, pauseSimulation, resetSimulation, setSpeed, setLevel } = useStore()

  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-os-dark rounded-lg border border-os-light p-4 shadow-lg"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Simulation Controls</h2>
          <div className="flex items-center">
            <Trophy className="mr-2 text-os-yellow" />
            <span className="text-os-yellow font-mono">Score: {simulation.score}</span>
          </div>
        </div>

        {/* Level Selection */}
        <div className="bg-os-darker rounded-md border border-os-light p-3 mb-4">
          <h3 className="text-sm font-bold text-gray-300 mb-2">Level</h3>

          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setLevel(1)}
              className={`text-xs py-2 px-3 rounded-md ${
                simulation.level === 1 ? "bg-os-blue text-white" : "bg-os-light text-gray-300 hover:bg-os-lighter"
              }`}
            >
              Level 1: Basics
            </button>
            <button
              onClick={() => setLevel(2)}
              className={`text-xs py-2 px-3 rounded-md ${
                simulation.level === 2 ? "bg-os-blue text-white" : "bg-os-light text-gray-300 hover:bg-os-lighter"
              }`}
            >
              Level 2: Deadlocks
            </button>
            <button
              onClick={() => setLevel(3)}
              className={`text-xs py-2 px-3 rounded-md ${
                simulation.level === 3 ? "bg-os-blue text-white" : "bg-os-light text-gray-300 hover:bg-os-lighter"
              }`}
            >
              Level 3: Advanced
            </button>
          </div>
        </div>

        {/* Simulation Speed */}
        <div className="bg-os-darker rounded-md border border-os-light p-3 mb-4">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-bold text-gray-300 flex items-center">
              <Clock className="mr-2 h-4 w-4 text-os-purple" />
              Simulation Speed
            </h3>
            <span className="text-xs font-mono text-os-purple">{simulation.speed}x</span>
          </div>

          <input
            type="range"
            min="0.5"
            max="3"
            step="0.5"
            value={simulation.speed}
            onChange={(e) => setSpeed(Number.parseFloat(e.target.value))}
            className="w-full h-2 bg-os-light rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Control Buttons */}
        <div className="grid grid-cols-3 gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={simulation.isRunning ? pauseSimulation : startSimulation}
                className={`flex items-center justify-center py-2 rounded-md ${
                  simulation.isRunning ? "bg-os-yellow text-white" : "bg-os-green text-white"
                }`}
              >
                {simulation.isRunning ? <Pause className="mr-1" size={16} /> : <Play className="mr-1" size={16} />}
                {simulation.isRunning ? "Pause" : "Start"}
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{simulation.isRunning ? "Pause the simulation" : "Start the simulation"}</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={resetSimulation}
                className="flex items-center justify-center py-2 bg-os-red text-white rounded-md"
              >
                <RotateCcw className="mr-1" size={16} />
                Reset
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Reset the simulation to its initial state</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setSpeed(Math.min(simulation.speed + 0.5, 3))}
                className="flex items-center justify-center py-2 bg-os-purple text-white rounded-md"
              >
                <FastForward className="mr-1" size={16} />
                Speed Up
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Increase the simulation speed</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Learning Tips */}
        <div className="mt-4 bg-os-blue/10 border border-os-blue/30 rounded-md p-3">
          <h3 className="text-sm font-bold text-os-blue mb-1">Learning Tip</h3>
          <p className="text-xs text-gray-300">
            {simulation.level === 1 &&
              "Try creating processes and observing how they move through different states in the process lifecycle."}
            {simulation.level === 2 &&
              "Experiment with allocating resources to processes to understand how deadlocks can occur."}
            {simulation.level === 3 &&
              "Compare different scheduling algorithms to see how they affect process execution order and efficiency."}
          </p>
        </div>
      </motion.div>
    </TooltipProvider>
  )
}
