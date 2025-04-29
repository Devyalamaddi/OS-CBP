"use client"

import { useState } from "react"
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd"
import { CheckCircle, XCircle, Clock, Activity } from "lucide-react"

type SchedulingChallengeProps = {
  challenge: any
  onSubmit: (isCorrect: boolean) => void
}

export function SchedulingChallenge({ challenge, onSubmit }: SchedulingChallengeProps) {
  const [processes, setProcesses] = useState(challenge.processes || [])
  const [executionOrder, setExecutionOrder] = useState<string[]>(challenge.initialOrder || [])
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<string>(challenge.initialAlgorithm || "")
  const [feedback, setFeedback] = useState<{ message: string; isCorrect: boolean } | null>(null)

  const handleDragEnd = (result: any) => {
    if (!result.destination) return

    const items = Array.from(executionOrder)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    setExecutionOrder(items)
  }

  const handleAlgorithmChange = (algorithm: string) => {
    setSelectedAlgorithm(algorithm)

    // Update execution order based on algorithm
    let newOrder: string[] = []

    switch (algorithm) {
      case "FCFS":
        newOrder = [...processes].sort((a, b) => a.arrivalTime - b.arrivalTime).map((p) => p.id)
        break
      case "SJF":
        newOrder = [...processes].sort((a, b) => a.burstTime - b.burstTime).map((p) => p.id)
        break
      case "Priority":
        newOrder = [...processes].sort((a, b) => b.priority - a.priority).map((p) => p.id)
        break
      case "RR":
        // For Round Robin, we need a more complex simulation
        // This is simplified for the challenge
        newOrder = challenge.rrOrder || executionOrder
        break
      default:
        newOrder = executionOrder
    }

    setExecutionOrder(newOrder)
  }

  const checkSolution = () => {
    // Check if the selected algorithm is correct
    const isAlgorithmCorrect = selectedAlgorithm === challenge.solution.algorithm

    // For some challenges, the execution order matters
    const isOrderCorrect = challenge.solution.checkOrder
      ? JSON.stringify(executionOrder) === JSON.stringify(challenge.solution.order)
      : true

    const isCorrect = isAlgorithmCorrect && isOrderCorrect

    if (isCorrect) {
      setFeedback({
        message: "Correct! You've selected the optimal scheduling algorithm.",
        isCorrect: true,
      })
    } else {
      setFeedback({
        message: !isAlgorithmCorrect
          ? `This algorithm isn't optimal for the given scenario. Try another one!`
          : `The execution order isn't optimal. Try rearranging the processes.`,
        isCorrect: false,
      })
    }

    onSubmit(isCorrect)
  }

  // Calculate metrics for the current execution order
  const calculateMetrics = () => {
    // This is a simplified calculation
    let waitingTime = 0
    let turnaroundTime = 0
    let responseTime = 0

    // For simplicity, we'll assume arrival time is 0 for all processes
    let currentTime = 0

    executionOrder.forEach((processId) => {
      const process = processes.find((p) => p.id === processId)
      if (!process) return

      waitingTime += currentTime
      responseTime += currentTime
      currentTime += process.burstTime
      turnaroundTime += currentTime
    })

    const avgWaitingTime = waitingTime / processes.length
    const avgTurnaroundTime = turnaroundTime / processes.length
    const avgResponseTime = responseTime / processes.length

    return {
      avgWaitingTime: avgWaitingTime.toFixed(2),
      avgTurnaroundTime: avgTurnaroundTime.toFixed(2),
      avgResponseTime: avgResponseTime.toFixed(2),
    }
  }

  const metrics = calculateMetrics()

  return (
    <div>
      {/* Algorithm Selection */}
      <div className="mb-6">
        <h3 className="text-white font-bold mb-2">Select Scheduling Algorithm</h3>
        <div className="grid grid-cols-4 gap-2">
          {["FCFS", "SJF", "Priority", "RR"].map((algorithm) => (
            <button
              key={algorithm}
              onClick={() => handleAlgorithmChange(algorithm)}
              className={`py-2 px-4 rounded-md ${
                selectedAlgorithm === algorithm
                  ? "bg-os-blue text-white"
                  : "bg-os-light text-gray-300 hover:bg-os-lighter"
              }`}
            >
              {algorithm}
            </button>
          ))}
        </div>
      </div>

      {/* Process Information */}
      <div className="mb-6">
        <h3 className="text-white font-bold mb-2">Process Information</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-os-darker">
                <th className="border border-os-light p-2 text-left text-gray-300">Process</th>
                <th className="border border-os-light p-2 text-left text-gray-300">Arrival Time</th>
                <th className="border border-os-light p-2 text-left text-gray-300">Burst Time</th>
                <th className="border border-os-light p-2 text-left text-gray-300">Priority</th>
              </tr>
            </thead>
            <tbody>
              {processes.map((process: any) => (
                <tr key={process.id} className="border-b border-os-light">
                  <td className="border border-os-light p-2 text-white">{process.name}</td>
                  <td className="border border-os-light p-2 text-white">{process.arrivalTime}</td>
                  <td className="border border-os-light p-2 text-white">{process.burstTime}</td>
                  <td className="border border-os-light p-2 text-white">{process.priority}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Execution Order */}
      <div className="mb-6">
        <h3 className="text-white font-bold mb-2">Execution Order</h3>
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="executionOrder" direction="horizontal">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="flex flex-wrap gap-2 p-4 bg-os-darker border border-os-light rounded-md min-h-[80px]"
              >
                {executionOrder.map((processId, index) => {
                  const process = processes.find((p) => p.id === processId)
                  return (
                    <Draggable key={processId} draggableId={processId} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="bg-os-purple/20 border border-os-purple text-white px-3 py-2 rounded-md flex items-center"
                        >
                          <span className="mr-2">{index + 1}.</span>
                          {process?.name}
                          <span className="ml-2 text-xs text-gray-400">({process?.burstTime} units)</span>
                        </div>
                      )}
                    </Draggable>
                  )
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      {/* Performance Metrics */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        <div className="bg-os-darker border border-os-light rounded-md p-3">
          <div className="flex items-center text-gray-300 mb-1">
            <Clock className="mr-2 h-4 w-4 text-os-yellow" />
            <h4 className="font-medium">Avg. Waiting Time</h4>
          </div>
          <p className="text-xl font-bold text-os-yellow">{metrics.avgWaitingTime}</p>
        </div>

        <div className="bg-os-darker border border-os-light rounded-md p-3">
          <div className="flex items-center text-gray-300 mb-1">
            <Clock className="mr-2 h-4 w-4 text-os-blue" />
            <h4 className="font-medium">Avg. Turnaround Time</h4>
          </div>
          <p className="text-xl font-bold text-os-blue">{metrics.avgTurnaroundTime}</p>
        </div>

        <div className="bg-os-darker border border-os-light rounded-md p-3">
          <div className="flex items-center text-gray-300 mb-1">
            <Activity className="mr-2 h-4 w-4 text-os-green" />
            <h4 className="font-medium">Avg. Response Time</h4>
          </div>
          <p className="text-xl font-bold text-os-green">{metrics.avgResponseTime}</p>
        </div>
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
          className="bg-os-blue hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-md transition-colors"
        >
          Check Solution
        </button>
      </div>
    </div>
  )
}
