"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { useStore } from "@/lib/store"
import { Play, Pause, Plus, Info } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { AddProcessModal } from "./add-process-modal"
import { SchedulingModeModal } from "../scheduler/scheduling-mode-modal"

export function ProcessLifecycle() {
  // Destructure only the values we need from the store
  const processes = useStore((state) => state.processes);
  const simulation = useStore((state) => state.simulation);
  const updateProcessState = useStore((state) => state.updateProcessState);
  const startSimulation = useStore((state) => state.startSimulation);
  const pauseSimulation = useStore((state) => state.pauseSimulation);
  const clearGanttChart = useStore((state) => state.clearGanttChart);
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false)
  const [isSchedulingModalOpen, setIsSchedulingModalOpen] = useState(false)

  // Function to create a new process
  const handleCreateProcess = () => {
    // Clear Gantt Chart data before adding a new process
    clearGanttChart()
    setIsProcessModalOpen(true)
  }

  // Handle play button click
  const handlePlayClick = () => {
    if (simulation.isRunning) {
      pauseSimulation()
    } else {
      // Show scheduling mode selection for SJF and Priority algorithms
      if (simulation.algorithm === "SJF" || simulation.algorithm === "Priority") {
        setIsSchedulingModalOpen(true)
      } else {
        startSimulation()
      }
    }
  }

  // Simulate process lifecycle
  useEffect(() => {
    if (!simulation.isRunning) return

    const interval = setInterval(() => {
      // Simple simulation logic
      processes.forEach((process) => {
        // Randomly transition processes between states
        if (process.state === "new") {
          updateProcessState(process.id, "ready")
        } else if (process.state === "ready" && Math.random() > 0.7) {
          updateProcessState(process.id, "running")
        } else if (process.state === "running") {
          if (Math.random() > 0.8) {
            updateProcessState(process.id, "waiting")
          } else if (Math.random() > 0.9) {
            updateProcessState(process.id, "terminated")
          }
        } else if (process.state === "waiting" && Math.random() > 0.7) {
          updateProcessState(process.id, "ready")
        }
      })
    }, 1000 / simulation.speed)

    return () => clearInterval(interval)
  }, [processes, simulation.isRunning, simulation.speed, updateProcessState])

  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-os-dark rounded-lg border border-os-light p-4 shadow-lg"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Process Lifecycle</h2>
          <div className="flex space-x-2">
            <button
              onClick={handleCreateProcess}
              className="bg-os-blue text-white p-2 rounded-md hover:bg-blue-600 transition-colors"
            >
              <Plus size={16} />
            </button>
            <button
              onClick={handlePlayClick}
              className={`${
                simulation.isRunning ? "bg-os-yellow" : "bg-os-green"
              } text-white p-2 rounded-md hover:opacity-90 transition-colors`}
            >
              {simulation.isRunning ? <Pause size={16} /> : <Play size={16} />}
            </button>
          </div>
        </div>

        {/* Process Visualization (Simplified) */}
        <div className="bg-os-darker rounded-md border border-os-light p-4 mb-4 h-64 flex items-center justify-center">
          {processes.length === 0 ? (
            <div className="text-center text-gray-500">No processes available. Click + to create a process.</div>
          ) : (
            <div className="w-full grid grid-cols-5 gap-4">
              {["new", "ready", "running", "waiting", "terminated"].map((state) => {
                const stateProcesses = processes.filter((p) => p.state === state)
                const stateColor =
                  state === "new"
                    ? "os-blue"
                    : state === "ready"
                      ? "os-green"
                      : state === "running"
                        ? "os-purple"
                        : state === "waiting"
                          ? "os-yellow"
                          : "os-red"

                return (
                  <div key={state} className="text-center">
                    <div className={`text-${stateColor} font-bold mb-2 capitalize`}>{state}</div>
                    <div className={`text-2xl font-bold mb-4 text-${stateColor}`}>{stateProcesses.length}</div>
                    <div className="space-y-1">
                      {stateProcesses.slice(0, 3).map((process) => (
                        <div key={process.id} className="bg-os-light rounded px-2 py-1 text-xs flex items-center">
                          <div className="w-2 h-2 rounded-full mr-1" style={{ backgroundColor: process.color }}></div>
                          <span className="truncate">{process.name}</span>
                        </div>
                      ))}
                      {stateProcesses.length > 3 && (
                        <div className="text-gray-500 text-xs">+{stateProcesses.length - 3} more</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Active Processes */}
        <div className="bg-os-darker rounded-md border border-os-light p-2 h-40 overflow-y-auto">
          <h3 className="text-sm font-bold text-gray-300 mb-2">Active Processes</h3>
          {processes.length === 0 ? (
            <div className="text-center text-gray-500 text-sm py-4">
              No processes running. Click + to create a process.
            </div>
          ) : (
            <div className="space-y-2">
              {processes
                .filter((p) => p.state !== "terminated")
                .map((process) => (
                  <div
                    key={process.id}
                    className="flex items-center justify-between bg-os-light rounded-md p-2 text-sm"
                  >
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: process.color }} />
                      <span className="text-white">{process.name}</span>
                    </div>
                    <div className="flex items-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs mr-2 ${
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
                      <Tooltip>
                        <TooltipTrigger>
                          <Info size={14} className="text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <div>
                            <p>Priority: {process.priority}</p>
                            <p>Burst Time: {process.burstTime}</p>
                            <p>Arrival: {process.arrivalTime.toFixed(1)}s</p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Modals */}
        {isProcessModalOpen && (
          <AddProcessModal isOpen={isProcessModalOpen} onClose={() => setIsProcessModalOpen(false)} />
        )}
        {isSchedulingModalOpen && (
          <SchedulingModeModal isOpen={isSchedulingModalOpen} onClose={() => setIsSchedulingModalOpen(false)} />
        )}
      </motion.div>
    </TooltipProvider>
  )
}


// "use client"

// import { useEffect, useState } from "react"
// import { motion } from "framer-motion"
// import { useStore } from "@/lib/store"
// import { Play, Pause, Plus, Info } from "lucide-react"
// import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
// import { AddProcessModal } from "./add-process-modal"
// import { SchedulingModeModal } from "../scheduler/scheduling-mode-modal"

// export function ProcessLifecycle() {
//   // Fix: Correctly destructure values from the store
//   const processes = useStore((state) => {
//     console.log('Processes data:', state.processes);
//     return state.processes;
//   });
//   const simulation = useStore((state) => state.simulation);
//   const updateProcessState = useStore((state) => state.updateProcessState);
//   const startSimulation = useStore((state) => state.startSimulation);
//   const pauseSimulation = useStore((state) => state.pauseSimulation);
//   const clearGanttChart = useStore((state) => state.clearGanttChart);

//   const [isProcessModalOpen, setIsProcessModalOpen] = useState(false)
//   const [isSchedulingModalOpen, setIsSchedulingModalOpen] = useState(false)

//   // Function to create a new process
//   const handleCreateProcess = () => {
//     // Clear Gantt Chart data before adding a new process
//     clearGanttChart()
//     setIsProcessModalOpen(true)
//   }

//   // Handle play button click
//   const handlePlayClick = () => {
//     if (simulation.isRunning) {
//       pauseSimulation()
//     } else {
//       // Show scheduling mode selection for SJF and Priority algorithms
//       if (simulation.algorithm === "SJF" || simulation.algorithm === "Priority") {
//         setIsSchedulingModalOpen(true)
//       } else {
//         startSimulation()
//       }
//     }
//   }

//   // Simulate process lifecycle
//   useEffect(() => {
//     if (!simulation.isRunning) return

//     const interval = setInterval(() => {
//       // Simple simulation logic
//       processes.forEach((process) => {
//         // Randomly transition processes between states
//         if (process.state === "new") {
//           updateProcessState(process.id, "ready")
//         } else if (process.state === "ready" && Math.random() > 0.7) {
//           updateProcessState(process.id, "running")
//         } else if (process.state === "running") {
//           if (Math.random() > 0.8) {
//             updateProcessState(process.id, "waiting")
//           } else if (Math.random() > 0.9) {
//             updateProcessState(process.id, "terminated")
//           }
//         } else if (process.state === "waiting" && Math.random() > 0.7) {
//           updateProcessState(process.id, "ready")
//         }
//       })
//     }, 1000 / simulation.speed)

//     return () => clearInterval(interval)
//   }, [processes, simulation.isRunning, simulation.speed, updateProcessState])

//   return (
//     <TooltipProvider>
//       <motion.div
//         initial={{ opacity: 0, y: 20 }}
//         animate={{ opacity: 1, y: 0 }}
//         className="bg-os-dark rounded-lg border border-os-light p-4 shadow-lg"
//       >
//         <div className="flex items-center justify-between mb-4">
//           <h2 className="text-xl font-bold text-white">Process Lifecycle</h2>
//           <div className="flex space-x-2">
//             <button
//               onClick={handleCreateProcess}
//               className="bg-os-blue text-white p-2 rounded-md hover:bg-blue-600 transition-colors"
//             >
//               <Plus size={16} />
//             </button>
//             <button
//               onClick={handlePlayClick}
//               className={`${
//                 simulation.isRunning ? "bg-os-yellow" : "bg-os-green"
//               } text-white p-2 rounded-md hover:opacity-90 transition-colors`}
//             >
//               {simulation.isRunning ? <Pause size={16} /> : <Play size={16} />}
//             </button>
//           </div>
//         </div>

//         {/* Process Visualization (Simplified) */}
//         <div className="bg-os-darker rounded-md border border-os-light p-4 mb-4 h-64 flex items-center justify-center">
//           {processes.length === 0 ? (
//             <div className="text-center text-gray-500">No processes available. Click + to create a process.</div>
//           ) : (
//             <div className="w-full grid grid-cols-5 gap-4">
//               {["new", "ready", "running", "waiting", "terminated"].map((state) => {
//                 const stateProcesses = processes.filter((p) => p.state === state)
//                 const stateColor =
//                   state === "new"
//                     ? "os-blue"
//                     : state === "ready"
//                       ? "os-green"
//                       : state === "running"
//                         ? "os-purple"
//                         : state === "waiting"
//                           ? "os-yellow"
//                           : "os-red"

//                 return (
//                   <div key={state} className="text-center">
//                     <div className={`text-${stateColor} font-bold mb-2 capitalize`}>{state}</div>
//                     <div className={`text-2xl font-bold mb-4 text-${stateColor}`}>{stateProcesses.length}</div>
//                     <div className="space-y-1">
//                       {stateProcesses.slice(0, 3).map((process) => (
//                         <div key={process.id} className="bg-os-light rounded px-2 py-1 text-xs flex items-center">
//                           <div className="w-2 h-2 rounded-full mr-1" style={{ backgroundColor: process.color }}></div>
//                           <span className="truncate">{process.name}</span>
//                         </div>
//                       ))}
//                       {stateProcesses.length > 3 && (
//                         <div className="text-gray-500 text-xs">+{stateProcesses.length - 3} more</div>
//                       )}
//                     </div>
//                   </div>
//                 )
//               })}
//             </div>
//           )}
//         </div>

//         {/* Active Processes */}
//         <div className="bg-os-darker rounded-md border border-os-light p-2 h-40 overflow-y-auto">
//           <h3 className="text-sm font-bold text-gray-300 mb-2">Active Processes</h3>
//           {processes.length === 0 ? (
//             <div className="text-center text-gray-500 text-sm py-4">
//               No processes running. Click + to create a process.
//             </div>
//           ) : (
//             <div className="space-y-2">
//               {processes
//                 .filter((p) => p.state !== "terminated")
//                 .map((process) => (
//                   <div
//                     key={process.id}
//                     className="flex items-center justify-between bg-os-light rounded-md p-2 text-sm"
//                   >
//                     <div className="flex items-center">
//                       <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: process.color }} />
//                       <span className="text-white">{process.name}</span>
//                     </div>
//                     <div className="flex items-center">
//                       <span
//                         className={`px-2 py-0.5 rounded-full text-xs mr-2 ${
//                           process.state === "new"
//                             ? "bg-os-blue/20 text-os-blue"
//                             : process.state === "ready"
//                               ? "bg-os-green/20 text-os-green"
//                               : process.state === "running"
//                                 ? "bg-os-purple/20 text-os-purple"
//                                 : process.state === "waiting"
//                                   ? "bg-os-yellow/20 text-os-yellow"
//                                   : "bg-os-red/20 text-os-red"
//                         }`}
//                       >
//                         {process.state}
//                       </span>
//                       <Tooltip>
//                         <TooltipTrigger>
//                           <Info size={14} className="text-gray-400" />
//                         </TooltipTrigger>
//                         <TooltipContent>
//                           <div>
//                             <p>Priority: {process.priority}</p>
//                             <p>Burst Time: {process.burstTime}</p>
//                             <p>Arrival: {process.arrivalTime.toFixed(1)}s</p>
//                           </div>
//                         </TooltipContent>
//                       </Tooltip>
//                     </div>
//                   </div>
//                 ))}
//             </div>
//           )}
//         </div>

//         {/* Modals */}
//         {isProcessModalOpen && (
//           <AddProcessModal isOpen={isProcessModalOpen} onClose={() => setIsProcessModalOpen(false)} />
//         )}
//         {isSchedulingModalOpen && (
//           <SchedulingModeModal isOpen={isSchedulingModalOpen} onClose={() => setIsSchedulingModalOpen(false)} />
//         )}
//       </motion.div>
//     </TooltipProvider>
//   )
// }