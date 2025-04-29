"use client"

import { useState } from "react"
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd"
import { CheckCircle, XCircle } from "lucide-react"

type ResourceChallengeProps = {
  challenge: any
  onSubmit: (isCorrect: boolean) => void
}

export function ResourceChallenge({ challenge, onSubmit }: ResourceChallengeProps) {
  const [resources, setResources] = useState(challenge.resources || [])
  const [processes, setProcesses] = useState(challenge.processes || [])
  const [allocation, setAllocation] = useState<Record<string, string[]>>(challenge.initialAllocation || {})
  const [feedback, setFeedback] = useState<{ message: string; isCorrect: boolean } | null>(null)

  const handleDragEnd = (result: any) => {
    if (!result.destination) return

    const { source, destination, draggableId } = result

    // If dragging from resources to processes
    if (source.droppableId === "resources" && destination.droppableId.startsWith("process-")) {
      const processId = destination.droppableId.replace("process-", "")

      // Check if the process already has this resource
      const processAllocation = allocation[processId] || []
      if (processAllocation.includes(draggableId)) return

      // Update allocation
      setAllocation({
        ...allocation,
        [processId]: [...processAllocation, draggableId],
      })
    }

    // If dragging from process back to resources
    if (source.droppableId.startsWith("process-") && destination.droppableId === "resources") {
      const processId = source.droppableId.replace("process-", "")

      // Remove resource from process allocation
      const processAllocation = allocation[processId] || []
      const updatedAllocation = {
        ...allocation,
        [processId]: processAllocation.filter((id) => id !== draggableId),
      }

      setAllocation(updatedAllocation)
    }
  }

  const checkSolution = () => {
    // Compare current allocation with solution
    const isCorrect = JSON.stringify(allocation) === JSON.stringify(challenge.solution)

    if (isCorrect) {
      setFeedback({
        message: "Correct! You've found the optimal resource allocation.",
        isCorrect: true,
      })
    } else {
      // Check if deadlock would occur
      const wouldDeadlock = checkForDeadlock(allocation)

      setFeedback({
        message: wouldDeadlock
          ? "This allocation would result in a deadlock. Try again!"
          : "Not quite right. This allocation works but isn't optimal.",
        isCorrect: false,
      })
    }

    onSubmit(isCorrect)
  }

  // Simple deadlock detection for the challenge
  const checkForDeadlock = (alloc: Record<string, string[]>) => {
    // This is a simplified version - in a real app, you'd implement a proper deadlock detection algorithm
    return (
      challenge.deadlockScenarios?.some((scenario: any) => JSON.stringify(alloc) === JSON.stringify(scenario)) || false
    )
  }

  return (
    <div>
      <DragDropContext onDragEnd={handleDragEnd}>
        {/* Available Resources */}
        <div className="mb-6">
          <h3 className="text-white font-bold mb-2">Available Resources</h3>
          <Droppable droppableId="resources" direction="horizontal">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="flex flex-wrap gap-2 p-4 bg-os-darker border border-os-light rounded-md min-h-[80px]"
              >
                {resources.map((resource: any, index: number) => (
                  <Draggable key={resource.id} draggableId={resource.id} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className="bg-os-green/20 border border-os-green text-white px-3 py-2 rounded-md"
                      >
                        {resource.name} ({resource.units} units)
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>

        {/* Processes */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {processes.map((process: any) => (
            <div key={process.id} className="bg-os-darker border border-os-light rounded-md p-4">
              <h4 className="text-white font-bold mb-2">{process.name}</h4>
              <p className="text-sm text-gray-400 mb-3">Needs: {process.needs.join(", ")}</p>

              <Droppable droppableId={`process-${process.id}`} direction="horizontal">
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="flex flex-wrap gap-2 p-3 bg-os-light/20 border border-os-light rounded-md min-h-[60px]"
                  >
                    {(allocation[process.id] || []).map((resourceId: string, index: number) => {
                      const resource = resources.find((r: any) => r.id === resourceId)
                      return (
                        <Draggable key={resourceId} draggableId={resourceId} index={index}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="bg-os-green/20 border border-os-green text-white px-2 py-1 rounded-md text-sm"
                            >
                              {resource?.name}
                            </div>
                          )}
                        </Draggable>
                      )
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>

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
