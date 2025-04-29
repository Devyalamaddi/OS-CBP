"use client"

import type React from "react"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, ShieldCheck, AlertTriangle, Plus, Minus } from "lucide-react"
import { useStore } from "@/lib/store"

type BankersAlgorithmModalProps = {
  isOpen: boolean
  onClose: () => void
}

export function BankersAlgorithmModal({ isOpen, onClose }: BankersAlgorithmModalProps) {
  const { processes, resources, addProcess, setMaximumResource, isSafeState } = useStore()

  const [numProcesses, setNumProcesses] = useState(3)
  const [numResources, setNumResources] = useState(2)

  const [newResources, setNewResources] = useState<Array<{ name: string; total: number }>>([
    { name: "Resource A", total: 10 },
    { name: "Resource B", total: 15 },
  ])

  const [maximumDemand, setMaximumDemand] = useState<Array<Array<number>>>([
    [7, 5],
    [3, 2],
    [9, 0],
  ])

  const [isSafe, setIsSafe] = useState<boolean | null>(null)

  const handleNumProcessesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const num = Number.parseInt(e.target.value)
    if (isNaN(num) || num < 1) return

    setNumProcesses(num)

    // Resize maximum demand array
    const newMaxDemand = [...maximumDemand]
    if (num > maximumDemand.length) {
      // Add new rows with zeros
      for (let i = maximumDemand.length; i < num; i++) {
        newMaxDemand.push(Array(numResources).fill(0))
      }
    } else {
      // Remove excess rows
      newMaxDemand.splice(num)
    }

    setMaximumDemand(newMaxDemand)
  }

  const handleNumResourcesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const num = Number.parseInt(e.target.value)
    if (isNaN(num) || num < 1) return

    setNumResources(num)

    // Resize resources array
    const newRes = [...newResources]
    if (num > newResources.length) {
      // Add new resources
      for (let i = newResources.length; i < num; i++) {
        newRes.push({ name: `Resource ${String.fromCharCode(65 + i)}`, total: 10 })
      }
    } else {
      // Remove excess resources
      newRes.splice(num)
    }
    setNewResources(newRes)

    // Resize maximum demand array columns
    const newMaxDemand = maximumDemand.map((row) => {
      const newRow = [...row]
      if (num > row.length) {
        // Add new columns with zeros
        for (let i = row.length; i < num; i++) {
          newRow.push(0)
        }
      } else {
        // Remove excess columns
        newRow.splice(num)
      }
      return newRow
    })

    setMaximumDemand(newMaxDemand)
  }

  const handleResourceTotalChange = (index: number, value: number) => {
    const newRes = [...newResources]
    newRes[index].total = value
    setNewResources(newRes)
  }

  const handleResourceNameChange = (index: number, name: string) => {
    const newRes = [...newResources]
    newRes[index].name = name
    setNewResources(newRes)
  }

  const handleMaxDemandChange = (processIndex: number, resourceIndex: number, value: number) => {
    const newMaxDemand = [...maximumDemand]
    newMaxDemand[processIndex][resourceIndex] = value
    setMaximumDemand(newMaxDemand)
  }

  const handleApply = () => {
    // Create the resources first
    const resourceIds: string[] = []

    for (let i = 0; i < numResources; i++) {
      // Check if resource already exists with this name
      const existingResource = resources.find((r) => r.name === newResources[i].name)

      if (existingResource) {
        resourceIds.push(existingResource.id)
      } else {
        // Create a new resource
        const resourceId = `r-${Date.now()}-${i}`
        resourceIds.push(resourceId)

        // Add to store
        useStore.setState((state) => ({
          resources: [
            ...state.resources,
            {
              id: resourceId,
              name: newResources[i].name,
              total: newResources[i].total,
              available: newResources[i].total,
              allocated: {},
              maximum: {},
            },
          ],
        }))
      }
    }

    // Now create the processes with their maximum demand
    for (let i = 0; i < numProcesses; i++) {
      // Create a new process
      const processName = `Process ${i + 1}`

      addProcess({
        name: processName,
        state: "new",
        priority: Math.floor(Math.random() * 10) + 1,
        burstTime: Math.floor(Math.random() * 10) + 1,
        arrivalTime: 0,
        resources: [],
      })

      // The process ID won't be known until after addProcess,
      // so we'll need to find it by name
      setTimeout(() => {
        const newProcess = useStore.getState().processes.find((p) => p.name === processName)

        if (newProcess) {
          // Set maximum resource demand for each resource
          for (let j = 0; j < numResources; j++) {
            setMaximumResource(newProcess.id, resourceIds[j], maximumDemand[i][j])
          }
        }
      }, 0)
    }

    // Check if the initial state is safe
    setTimeout(() => {
      const safe = useStore.getState().isSafeState()
      setIsSafe(safe)
    }, 100)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-os-dark rounded-lg border border-os-light p-6 shadow-xl w-full max-w-5xl overflow-y-auto max-h-[90vh]"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white flex items-center">
                <ShieldCheck className="mr-2 text-os-green" />
                Banker's Algorithm for Deadlock Avoidance
              </h2>
              <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              <div className="bg-os-darker p-4 rounded-md border border-os-light">
                <h3 className="text-white font-bold mb-2">System Configuration</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Number of Processes</label>
                    <div className="flex items-center">
                      <button
                        className="bg-os-light p-1 rounded-l-md border-r border-os-dark"
                        onClick={() => {
                          if (numProcesses > 1) {
                            handleNumProcessesChange({ target: { value: (numProcesses - 1).toString() } } as any)
                          }
                        }}
                      >
                        <Minus size={16} className="text-white" />
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={numProcesses}
                        onChange={handleNumProcessesChange}
                        className="bg-os-darker border-y border-os-light py-1 px-3 w-16 text-center text-white focus:outline-none"
                      />
                      <button
                        className="bg-os-light p-1 rounded-r-md border-l border-os-dark"
                        onClick={() => {
                          handleNumProcessesChange({ target: { value: (numProcesses + 1).toString() } } as any)
                        }}
                      >
                        <Plus size={16} className="text-white" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Number of Resource Types</label>
                    <div className="flex items-center">
                      <button
                        className="bg-os-light p-1 rounded-l-md border-r border-os-dark"
                        onClick={() => {
                          if (numResources > 1) {
                            handleNumResourcesChange({ target: { value: (numResources - 1).toString() } } as any)
                          }
                        }}
                      >
                        <Minus size={16} className="text-white" />
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={numResources}
                        onChange={handleNumResourcesChange}
                        className="bg-os-darker border-y border-os-light py-1 px-3 w-16 text-center text-white focus:outline-none"
                      />
                      <button
                        className="bg-os-light p-1 rounded-r-md border-l border-os-dark"
                        onClick={() => {
                          handleNumResourcesChange({ target: { value: (numResources + 1).toString() } } as any)
                        }}
                      >
                        <Plus size={16} className="text-white" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-os-darker p-4 rounded-md border border-os-light">
                <h3 className="text-white font-bold mb-2">Available Resources</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {newResources.map((resource, index) => (
                    <div key={index} className="space-y-2">
                      <label className="block text-sm font-medium text-gray-400">Resource Name</label>
                      <input
                        type="text"
                        value={resource.name}
                        onChange={(e) => handleResourceNameChange(index, e.target.value)}
                        className="bg-os-darker border border-os-light rounded-md py-1 px-3 w-full text-white focus:outline-none focus:ring-1 focus:ring-os-blue"
                      />

                      <label className="block text-sm font-medium text-gray-400">Total Units</label>
                      <input
                        type="number"
                        min="1"
                        value={resource.total}
                        onChange={(e) => handleResourceTotalChange(index, Number.parseInt(e.target.value) || 0)}
                        className="bg-os-darker border border-os-light rounded-md py-1 px-3 w-full text-white focus:outline-none focus:ring-1 focus:ring-os-blue"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-os-darker p-4 rounded-md border border-os-light">
                <h3 className="text-white font-bold mb-2">Maximum Resource Demand Matrix</h3>
                <p className="text-gray-400 text-sm mb-4">
                  Specify the maximum number of resources each process might need during its lifetime.
                </p>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="text-left text-gray-400 p-2 border-b border-os-light">Process</th>
                        {newResources.map((r, i) => (
                          <th key={i} className="text-left text-gray-400 p-2 border-b border-os-light">
                            {r.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({ length: numProcesses }).map((_, processIndex) => (
                        <tr key={processIndex} className="border-b border-os-light">
                          <td className="p-2 text-white">Process {processIndex + 1}</td>
                          {Array.from({ length: numResources }).map((_, resourceIndex) => (
                            <td key={resourceIndex} className="p-2">
                              <input
                                type="number"
                                min="0"
                                value={maximumDemand[processIndex]?.[resourceIndex] || 0}
                                onChange={(e) =>
                                  handleMaxDemandChange(
                                    processIndex,
                                    resourceIndex,
                                    Number.parseInt(e.target.value) || 0,
                                  )
                                }
                                className="bg-os-darker border border-os-light rounded-md py-1 px-3 w-16 text-white focus:outline-none focus:ring-1 focus:ring-os-blue"
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {isSafe !== null && (
                <div
                  className={`p-4 rounded-md border ${isSafe ? "bg-green-900/30 border-green-700" : "bg-red-900/30 border-red-700"}`}
                >
                  {isSafe ? (
                    <div className="flex items-center text-os-green">
                      <ShieldCheck className="mr-2" />
                      <span className="font-bold">System is in a safe state!</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-os-red">
                      <AlertTriangle className="mr-2" />
                      <span className="font-bold">System is NOT in a safe state! Deadlock may occur.</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="bg-os-light text-white py-2 px-4 rounded-md hover:bg-os-lighter transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApply}
                  className="bg-os-blue text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors"
                >
                  Apply Configuration
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
