"use client"

import { useState } from "react"
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react"

type DeadlockChallengeProps = {
  challenge: any
  onSubmit: (isCorrect: boolean) => void
}

export function DeadlockChallenge({ challenge, onSubmit }: DeadlockChallengeProps) {
  const [allocation, setAllocation] = useState<Record<string, Record<string, number>>>(challenge.allocation || {})
  const [request, setRequest] = useState<Record<string, Record<string, number>>>(challenge.request || {})
  const [available, setAvailable] = useState<Record<string, number>>(challenge.available || {})
  const [safeSequence, setSafeSequence] = useState<string[]>([])
  const [feedback, setFeedback] = useState<{ message: string; isCorrect: boolean } | null>(null)

  const processes = challenge.processes || []
  const resources = challenge.resources || []

  const handleAllocationChange = (processId: string, resourceId: string, value: number) => {
    setAllocation({
      ...allocation,
      [processId]: {
        ...allocation[processId],
        [resourceId]: value,
      },
    })
  }

  const handleRequestChange = (processId: string, resourceId: string, value: number) => {
    setRequest({
      ...request,
      [processId]: {
        ...request[processId],
        [resourceId]: value,
      },
    })
  }

  const handleAvailableChange = (resourceId: string, value: number) => {
    setAvailable({
      ...available,
      [resourceId]: value,
    })
  }

  const handleSafeSequenceChange = (index: number, processId: string) => {
    const newSequence = [...safeSequence]
    newSequence[index] = processId
    setSafeSequence(newSequence)
  }

  const checkSolution = () => {
    // Check if the safe sequence is correct
    const isCorrect = JSON.stringify(safeSequence) === JSON.stringify(challenge.solution)

    if (isCorrect) {
      setFeedback({
        message: "Correct! You've found a valid safe sequence that avoids deadlock.",
        isCorrect: true,
      })
    } else {
      // Check if the sequence is valid but not optimal
      const isValid = isValidSafeSequence(safeSequence)

      setFeedback({
        message: isValid
          ? "This sequence works but isn't the optimal solution. Try again!"
          : "This sequence would result in a deadlock. Check your work.",
        isCorrect: false,
      })
    }

    onSubmit(isCorrect)
  }

  // Check if a sequence is valid (simplified)
  const isValidSafeSequence = (sequence: string[]) => {
    // This is a simplified version - in a real app, you'd implement the Banker's Algorithm

    // Clone available resources
    const work = { ...available }
    const finish: Record<string, boolean> = {}

    // Initialize all processes as unfinished
    processes.forEach((process) => {
      finish[process.id] = false
    })

    // Check if the sequence is valid
    for (const processId of sequence) {
      // If process is already finished, skip
      if (finish[processId]) continue

      // Check if all resources needed are available
      const canExecute = Object.keys(request[processId] || {}).every((resourceId) => {
        return (request[processId][resourceId] || 0) <= (work[resourceId] || 0)
      })

      if (!canExecute) return false

      // Process can execute, update available resources
      Object.keys(allocation[processId] || {}).forEach((resourceId) => {
        work[resourceId] = (work[resourceId] || 0) + (allocation[processId][resourceId] || 0)
      })

      // Mark process as finished
      finish[processId] = true
    }

    // Check if all processes are finished
    return Object.values(finish).every((f) => f)
  }

  return (
    <div>
      {/* Resource Allocation Matrix */}
      <div className="mb-6">
        <h3 className="text-white font-bold mb-2">Resource Allocation Matrix</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-os-darker">
                <th className="border border-os-light p-2 text-left text-gray-300">Process</th>
                {resources.map((resource: any) => (
                  <th key={resource.id} className="border border-os-light p-2 text-left text-gray-300">
                    {resource.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {processes.map((process: any) => (
                <tr key={process.id} className="border-b border-os-light">
                  <td className="border border-os-light p-2 text-white">{process.name}</td>
                  {resources.map((resource: any) => (
                    <td key={resource.id} className="border border-os-light p-2">
                      <input
                        type="number"
                        min="0"
                        value={allocation[process.id]?.[resource.id] || 0}
                        onChange={(e) =>
                          handleAllocationChange(process.id, resource.id, Number.parseInt(e.target.value) || 0)
                        }
                        className="w-12 bg-os-darker border border-os-light rounded-md p-1 text-center text-white"
                        disabled={challenge.readOnly}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resource Request Matrix */}
      <div className="mb-6">
        <h3 className="text-white font-bold mb-2">Resource Request Matrix</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-os-darker">
                <th className="border border-os-light p-2 text-left text-gray-300">Process</th>
                {resources.map((resource: any) => (
                  <th key={resource.id} className="border border-os-light p-2 text-left text-gray-300">
                    {resource.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {processes.map((process: any) => (
                <tr key={process.id} className="border-b border-os-light">
                  <td className="border border-os-light p-2 text-white">{process.name}</td>
                  {resources.map((resource: any) => (
                    <td key={resource.id} className="border border-os-light p-2">
                      <input
                        type="number"
                        min="0"
                        value={request[process.id]?.[resource.id] || 0}
                        onChange={(e) =>
                          handleRequestChange(process.id, resource.id, Number.parseInt(e.target.value) || 0)
                        }
                        className="w-12 bg-os-darker border border-os-light rounded-md p-1 text-center text-white"
                        disabled={challenge.readOnly}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Available Resources */}
      <div className="mb-6">
        <h3 className="text-white font-bold mb-2">Available Resources</h3>
        <div className="flex flex-wrap gap-4">
          {resources.map((resource: any) => (
            <div key={resource.id} className="bg-os-darker border border-os-light rounded-md p-3">
              <h4 className="text-white mb-1">{resource.name}</h4>
              <input
                type="number"
                min="0"
                value={available[resource.id] || 0}
                onChange={(e) => handleAvailableChange(resource.id, Number.parseInt(e.target.value) || 0)}
                className="w-16 bg-os-light border border-os-light rounded-md p-1 text-center text-white"
                disabled={challenge.readOnly}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Safe Sequence */}
      <div className="mb-6">
        <h3 className="text-white font-bold mb-2">Find Safe Sequence</h3>
        <p className="text-gray-300 mb-3">
          Arrange processes in a sequence that ensures safe execution without deadlock.
        </p>

        <div className="flex flex-wrap gap-2 mb-4">
          {Array.from({ length: processes.length }).map((_, index) => (
            <div key={index} className="flex items-center">
              <span className="text-white mr-2">{index + 1}.</span>
              <select
                value={safeSequence[index] || ""}
                onChange={(e) => handleSafeSequenceChange(index, e.target.value)}
                className="bg-os-darker border border-os-light rounded-md p-2 text-white"
              >
                <option value="">Select Process</option>
                {processes.map((process: any) => (
                  <option key={process.id} value={process.id} disabled={safeSequence.includes(process.id)}>
                    {process.name}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>

        {/* Warning if sequence is incomplete */}
        {safeSequence.length < processes.length && (
          <div className="bg-yellow-900/30 border border-yellow-700 rounded-md p-3 flex items-center mb-4">
            <AlertTriangle className="text-os-yellow mr-2 h-5 w-5" />
            <p className="text-os-yellow">Complete the sequence by selecting all processes in a safe order.</p>
          </div>
        )}
      </div>

      {/* Feedback */}
      {feedback && (
        <div
          className={`mb-4 p-3 rounded-md flex items-start ${
            feedback.isCorrect ? "bg-green-900/30 border border-green-700" : "bg-red-900/30 border border-red-700"
          }`}
        >
          {feedback.isCorrect ? (
            <CheckCircle className="text-os-green mr-2 h-5 w-5 mt-0.5" />
          ) : (
            <XCircle className="text-os-red mr-2 h-5 w-5 mt-0.5" />
          )}
          <p className={feedback.isCorrect ? "text-os-green" : "text-os-red"}>{feedback.message}</p>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-center">
        <button
          onClick={checkSolution}
          disabled={safeSequence.length < processes.length}
          className={`bg-os-blue hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-md transition-colors ${
            safeSequence.length < processes.length ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          Check Solution
        </button>
      </div>
    </div>
  )
}
