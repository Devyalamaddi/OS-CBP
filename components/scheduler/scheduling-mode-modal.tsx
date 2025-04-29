"use client"

import { motion, AnimatePresence } from "framer-motion"
import { X, Settings } from "lucide-react"
import { useStore } from "@/lib/store"

type SchedulingModeModalProps = {
  isOpen: boolean
  onClose: () => void
}

export function SchedulingModeModal({ isOpen, onClose }: SchedulingModeModalProps) {
  const { simulation, setSchedulingMode, startSimulation } = useStore()

  const handleModeSelect = (mode: "preemptive" | "non-preemptive") => {
    setSchedulingMode(mode)
    startSimulation(mode)
    onClose()
  }

  // Only SJF and Priority algorithms can use both modes
  const needsModeSelection = simulation.algorithm === "SJF" || simulation.algorithm === "Priority"

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-os-dark rounded-lg border border-os-light p-6 shadow-xl w-full max-w-md"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white flex items-center">
                <Settings className="mr-2 text-os-blue" />
                Scheduling Mode
              </h2>
              <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            {needsModeSelection ? (
              <div className="space-y-4">
                <p className="text-gray-300 mb-4">
                  Select a scheduling mode for {simulation.algorithm === "SJF" ? "Shortest Job First" : "Priority"}{" "}
                  algorithm:
                </p>

                <div className="grid grid-cols-1 gap-3">
                  <button
                    onClick={() => handleModeSelect("non-preemptive")}
                    className="bg-os-light hover:bg-os-lighter text-white p-4 rounded-md transition-colors text-left"
                  >
                    <div className="font-bold mb-1">Non-Preemptive</div>
                    <div className="text-xs text-gray-400">
                      Once a process starts executing, it continues until completion or I/O wait.
                    </div>
                  </button>

                  <button
                    onClick={() => handleModeSelect("preemptive")}
                    className="bg-os-light hover:bg-os-lighter text-white p-4 rounded-md transition-colors text-left"
                  >
                    <div className="font-bold mb-1">Preemptive</div>
                    <div className="text-xs text-gray-400">
                      {simulation.algorithm === "SJF"
                        ? "A process can be interrupted if a new process with shorter remaining time arrives (SRTF)."
                        : "A process can be interrupted if a higher priority process becomes ready."}
                    </div>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-gray-300 mb-4">
                  {simulation.algorithm === "FCFS"
                    ? "First-Come, First-Served (FCFS) is always non-preemptive."
                    : "Round Robin (RR) is always preemptive with time quantum."}
                </p>

                <button
                  onClick={() => {
                    // For FCFS, always use non-preemptive
                    // For RR, always use preemptive
                    const mode = simulation.algorithm === "FCFS" ? "non-preemptive" : "preemptive"
                    handleModeSelect(mode)
                  }}
                  className="w-full bg-os-blue hover:bg-blue-600 text-white py-2 px-4 rounded-md transition-colors"
                >
                  Start Simulation
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
