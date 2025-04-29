"use client"

import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import { useStore } from "@/lib/store"
import * as d3 from "d3"
import { Plus, Trash2, AlertTriangle, ShieldCheck } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { BankersAlgorithmModal } from "./bankers-algorithm-modal"

export function ResourceAllocationGraph() {
  const {
    processes,
    resources,
    simulation,
    addProcess,
    allocateResource,
    releaseResource,
    detectDeadlock,
    isSafeState,
  } = useStore()

  const svgRef = useRef<SVGSVGElement>(null)
  const [isBankersModalOpen, setBankersModalOpen] = useState(false)
  const [deadlockMessage, setDeadlockMessage] = useState<string | null>(null)
  const [animationActive, setAnimationActive] = useState(false)

  // Add a new resource
  const handleAddResource = () => {
    setBankersModalOpen(true)
  }

  // Allocate a resource to a process
  const handleAllocateResource = (processId: string, resourceId: string) => {
    allocateResource(processId, resourceId, 1)
    // Trigger animation
    setAnimationActive(true)
    setTimeout(() => setAnimationActive(false), 1500)
  }

  // Release a resource from a process
  const handleReleaseResource = (processId: string, resourceId: string) => {
    releaseResource(processId, resourceId, 1)
    // Trigger animation
    setAnimationActive(true)
    setTimeout(() => setAnimationActive(false), 1500)
  }

  // Generate deadlock message when detected
  useEffect(() => {
    if (simulation.deadlockDetected) {
      // Find processes and resources involved in deadlock
      const waitingProcesses = processes.filter((p) => p.state === "waiting")

      if (waitingProcesses.length === 0) {
        setDeadlockMessage(null)
        return
      }

      // Find resources that are fully allocated
      const fullyAllocatedResources = resources.filter((r) => r.available === 0)

      // Create deadlock message
      let message = "Deadlock detected between:\n"

      // List waiting processes
      message += "\nProcesses waiting for resources:\n"
      waitingProcesses.forEach((p) => {
        message += `- ${p.name} is waiting for resources\n`
      })

      // List fully allocated resources
      message += "\nResources with no available units:\n"
      fullyAllocatedResources.forEach((r) => {
        const holders = Object.entries(r.allocated)
          .filter(([_, amount]) => amount > 0)
          .map(([processId]) => processes.find((p) => p.id === processId)?.name || processId)

        message += `- ${r.name} is held by: ${holders.join(", ")}\n`
      })

      // Add suggestions
      message += "\nSuggestions to resolve deadlock:\n"
      message += "1. Reorder resource requests to prevent circular wait\n"
      message += "2. Release some allocated resources\n"
      message += "3. Use preemptive resource management\n"
      message += "4. Apply Banker's Algorithm for deadlock avoidance"

      setDeadlockMessage(message)

      // Apply negative score feedback for deadlock
      useStore.setState((state) => ({
        simulation: {
          ...state.simulation,
          score: Math.max(0, state.simulation.score - 50), // Subtract points for deadlock
        },
        gameMetrics: {
          ...state.gameMetrics,
          deadlocksOccurred: state.gameMetrics.deadlocksOccurred + 1,
        },
      }))
    } else {
      setDeadlockMessage(null)
    }
  }, [simulation.deadlockDetected, processes, resources])

  // Render the resource allocation graph using D3
  useEffect(() => {
    if (!svgRef.current) return

    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove()

    const width = svgRef.current.clientWidth
    const height = svgRef.current.clientHeight

    // Create nodes for processes and resources
    const nodes: any[] = [
      ...processes.map((p) => ({
        id: p.id,
        name: p.name,
        type: "process",
        color: p.color,
        state: p.state,
      })),
      ...resources.map((r) => ({
        id: r.id,
        name: r.name,
        type: "resource",
        total: r.total,
        available: r.available,
      })),
    ]

    // Create links between processes and resources
    const links: any[] = []

    // Process to Resource links (requests)
    processes.forEach((process) => {
      // For resources allocated to this process
      resources.forEach((resource) => {
        const allocated = resource.allocated[process.id] || 0
        if (allocated > 0) {
          links.push({
            source: resource.id,
            target: process.id,
            type: "allocation",
            value: allocated,
          })
        }
      })

      // For resources this process is waiting for
      if (process.state === "waiting") {
        process.resources.forEach((resourceId) => {
          links.push({
            source: process.id,
            target: resourceId,
            type: "request",
            dashed: true,
          })
        })
      }
    })

    // Create a force simulation
    const simulation = d3
      .forceSimulation(nodes)
      .force(
        "link",
        d3
          .forceLink(links)
          .id((d: any) => d.id)
          .distance(100),
      )
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("x", d3.forceX(width / 2).strength(0.1))
      .force("y", d3.forceY(height / 2).strength(0.1))

    // Create a gradient for deadlock highlighting
    const defs = svg.append("defs")

    // Create a filter for the glow effect
    const filter = defs
      .append("filter")
      .attr("id", "glow")
      .attr("x", "-50%")
      .attr("y", "-50%")
      .attr("width", "200%")
      .attr("height", "200%")

    filter.append("feGaussianBlur").attr("stdDeviation", "3").attr("result", "coloredBlur")

    const feMerge = filter.append("feMerge")
    feMerge.append("feMergeNode").attr("in", "coloredBlur")
    feMerge.append("feMergeNode").attr("in", "SourceGraphic")

    // Create markers for arrows
    const markers = defs
      .selectAll("marker")
      .data(["allocation", "request", "deadlock"])
      .enter()
      .append("marker")
      .attr("id", (d) => d)
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 20)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")

    markers
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", (d) => (d === "allocation" ? "#43E97B" : d === "deadlock" ? "#FF5E62" : "#4FACFE"))

    // Create links with arrows
    const link = svg
      .append("g")
      .selectAll("path")
      .data(links)
      .enter()
      .append("path")
      .attr("stroke", (d) => {
        if (simulation.deadlockDetected && (d.source.state === "waiting" || d.target.state === "waiting")) {
          return "#FF5E62" // Red for deadlock
        }
        return d.type === "allocation" ? "#43E97B" : "#4FACFE"
      })
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", (d) => (d.value ? 2 + d.value : 2))
      .attr("stroke-dasharray", (d) => (d.dashed ? "5,5" : ""))
      .attr("marker-end", (d) => {
        if (simulation.deadlockDetected && (d.source.state === "waiting" || d.target.state === "waiting")) {
          return "url(#deadlock)"
        }
        return `url(#${d.type})`
      })
      .attr("fill", "none")
      .attr("filter", (d) => {
        if (simulation.deadlockDetected && (d.source.state === "waiting" || d.target.state === "waiting")) {
          return "url(#glow)"
        }
        return null
      })

    // Add animated flow for active links
    const addFlowAnimation = () => {
      link.each(function (d) {
        const path = d3.select(this)

        // Create animated flow particles
        const flowLine = svg.append("g").attr("class", "flow-particles")

        // Add multiple particles per line
        for (let i = 0; i < 3; i++) {
          flowLine
            .append("circle")
            .attr("r", 2)
            .attr("fill", d.type === "allocation" ? "#43E97B" : "#4FACFE")
            .attr("opacity", 0.8)
            .attr("transform", `translate(${d.source.x},${d.source.y})`)
            .transition()
            .duration(1000)
            .delay(i * 300)
            .attr("transform", `translate(${d.target.x},${d.target.y})`)
            .on("end", function () {
              d3.select(this).remove()
            })
        }
      })
    }

    // Trigger animation immediately for initial rendering
    setTimeout(() => {
      if (nodes.length > 0 && links.length > 0) {
        addFlowAnimation()
      }
    }, 500)

    // Create nodes group
    const node = svg
      .append("g")
      .selectAll("g")
      .data(nodes)
      .enter()
      .append("g")
      .call(d3.drag<SVGGElement, any>().on("start", dragstarted).on("drag", dragged).on("end", dragended))
      .attr("class", (d) => {
        if (simulation.deadlockDetected && d.state === "waiting") {
          return "deadlocked-node"
        }
        return ""
      })

    // Process nodes (circles)
    node
      .filter((d) => d.type === "process")
      .append("circle")
      .attr("r", 20)
      .attr("fill", (d) => d.color)
      .attr("stroke", (d) => {
        if (simulation.deadlockDetected && d.state === "waiting") {
          return "#FF5E62" // Red stroke for deadlocked processes
        }
        return "#fff"
      })
      .attr("stroke-width", (d) => {
        if (simulation.deadlockDetected && d.state === "waiting") {
          return 3 // Thicker stroke for deadlocked processes
        }
        return 2
      })
      .attr("class", "process-node")
      .attr("filter", (d) => {
        if (simulation.deadlockDetected && d.state === "waiting") {
          return "url(#glow)"
        }
        return null
      })

    // Add a pulsing animation for deadlocked processes
    if (simulation.deadlockDetected) {
      node
        .filter((d) => d.type === "process" && d.state === "waiting")
        .append("circle")
        .attr("r", 20)
        .attr("fill", "none")
        .attr("stroke", "#FF5E62")
        .attr("stroke-width", 2)
        .attr("opacity", 0.5)
        .attr("class", "pulse-circle")
        .call(pulse)
    }

    // Resource nodes (rectangles)
    const resourceNodes = node.filter((d) => d.type === "resource")

    resourceNodes
      .append("rect")
      .attr("width", 30)
      .attr("height", 30)
      .attr("x", -15)
      .attr("y", -15)
      .attr("fill", "#43E97B")
      .attr("stroke", (d) => {
        // Check if this resource is involved in a deadlock
        if (simulation.deadlockDetected && d.available === 0) {
          const isInDeadlock = links.some(
            (link) =>
              (link.source.id === d.id || link.target.id === d.id) &&
              ((link.source.type === "process" && link.source.state === "waiting") ||
                (link.target.type === "process" && link.target.state === "waiting")),
          )

          if (isInDeadlock) {
            return "#FF5E62" // Red stroke for resources in deadlock
          }
        }
        return "#fff"
      })
      .attr("stroke-width", (d) => {
        if (simulation.deadlockDetected && d.available === 0) {
          return 3 // Thicker stroke for resources in deadlock
        }
        return 2
      })
      .attr("rx", 4)
      .attr("class", "resource-node")
      .attr("filter", (d) => {
        // Check if this resource is involved in a deadlock
        if (simulation.deadlockDetected && d.available === 0) {
          const isInDeadlock = links.some(
            (link) =>
              (link.source.id === d.id || link.target.id === d.id) &&
              ((link.source.type === "process" && link.source.state === "waiting") ||
                (link.target.type === "process" && link.target.state === "waiting")),
          )

          if (isInDeadlock) {
            return "url(#glow)"
          }
        }
        return null
      })

    // Add resource availability indicator
    resourceNodes
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", 5)
      .attr("fill", "#fff")
      .attr("font-size", "12px")
      .attr("font-weight", "bold")
      .text((d) => `${d.available}/${d.total}`)

    // Node labels
    node
      .append("text")
      .text((d) => d.name)
      .attr("text-anchor", "middle")
      .attr("dy", 35) // Move labels a bit further from nodes
      .attr("fill", "#fff")
      .attr("font-size", "10px")

    // Update positions on simulation tick
    simulation.on("tick", () => {
      link.attr("d", (d) => {
        const dx = d.target.x - d.source.x
        const dy = d.target.y - d.source.y
        const dr = Math.sqrt(dx * dx + dy * dy)
        return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`
      })

      node.attr("transform", (d) => `translate(${d.x},${d.y})`)
    })

    // Drag functions
    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart()
      d.fx = d.x
      d.fy = d.y
    }

    function dragged(event: any, d: any) {
      d.fx = event.x
      d.fy = event.y
    }

    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0)
      d.fx = null
      d.fy = null
    }

    // Pulsing animation function
    function pulse(selection: any) {
      function repeat() {
        selection
          .transition()
          .duration(500)
          .attr("r", 25)
          .attr("opacity", 0.1)
          .transition()
          .duration(500)
          .attr("r", 20)
          .attr("opacity", 0.5)
          .on("end", repeat)
      }
      repeat()
    }

    // Check for deadlocks
    detectDeadlock()

    // Add freeze animation if deadlock is detected
    if (simulation.deadlockDetected) {
      // Slow down the simulation to create a "freeze" effect
      simulation.alpha(0.1).alphaDecay(0.02)

      // Add a semi-transparent overlay to indicate system freeze
      svg
        .append("rect")
        .attr("width", width)
        .attr("height", height)
        .attr("fill", "#FF5E62")
        .attr("opacity", 0.05)
        .attr("class", "freeze-overlay")
    }

    return () => {
      simulation.stop()
    }
  }, [processes, resources, detectDeadlock, simulation.deadlockDetected])

  // Add a separate effect to handle animation when resources are allocated or released
  useEffect(() => {
    if (animationActive && svgRef.current) {
      const svg = d3.select(svgRef.current)

      // Find all paths (links)
      const links = svg.selectAll("path")

      links.each((d: any) => {
        if (!d) return

        // Create animated flow particles
        const flowLine = svg.append("g").attr("class", "flow-particles")

        // Add multiple particles per line
        for (let i = 0; i < 3; i++) {
          flowLine
            .append("circle")
            .attr("r", 2)
            .attr("fill", d.type === "allocation" ? "#43E97B" : "#4FACFE")
            .attr("opacity", 0.8)
            .attr("transform", `translate(${d.source.x},${d.source.y})`)
            .transition()
            .duration(1000)
            .delay(i * 300)
            .attr("transform", `translate(${d.target.x},${d.target.y})`)
            .on("end", function () {
              d3.select(this).remove()
            })
        }
      })
    }
  }, [animationActive])

  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-os-dark rounded-lg border border-os-light p-4 shadow-lg"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Resource Allocation Graph</h2>
          <div className="flex space-x-2">
            <Tooltip>
              <TooltipTrigger>
                <div
                  onClick={handleAddResource}
                  className="bg-os-green p-2 text-white rounded-md hover:bg-green-600 transition-colors"
                  title="Configure Resource System"
                >
                  <Plus size={16} />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Configure Resource System (Banker's Algorithm)</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {simulation.deadlockDetected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-red-900/30 border border-red-700 rounded-md p-3 flex items-start mb-4"
          >
            <AlertTriangle className="text-os-red mr-2 h-5 w-5 animate-pulse mt-1 flex-shrink-0" />
            <div>
              <h3 className="text-os-red font-bold text-sm mb-1">Deadlock Detected!</h3>
              {deadlockMessage ? (
                <pre className="text-xs text-gray-300 whitespace-pre-wrap">{deadlockMessage}</pre>
              ) : (
                <p className="text-xs text-gray-300">Circular wait condition found in resource allocation</p>
              )}
              <p className="text-xs text-os-red mt-2 font-semibold">-50 points penalty applied</p>
            </div>
          </motion.div>
        )}

        {/* Safe state indicator (for Banker's Algorithm) */}
        {!simulation.deadlockDetected && resources.some((r) => r.maximum) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-green-900/30 border border-green-700 rounded-md p-3 flex items-center mb-4"
          >
            <ShieldCheck className="text-os-green mr-2 h-5 w-5" />
            <div>
              <h3 className="text-os-green font-bold text-sm">
                {isSafeState() ? "System is in a safe state" : "Warning: System is not in a safe state"}
              </h3>
              <p className="text-xs text-gray-300">
                {isSafeState()
                  ? "All processes can complete without deadlock"
                  : "Resource allocation may lead to a deadlock"}
              </p>
            </div>
          </motion.div>
        )}

        {/* Graph Visualization */}
        <div className="bg-os-darker rounded-md border border-os-light h-64 mb-4 overflow-hidden">
          <svg ref={svgRef} width="100%" height="100%" />
        </div>

        {/* Resource Controls */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-os-darker rounded-md border border-os-light p-2 h-40 overflow-y-auto">
            <h3 className="text-sm font-bold text-gray-300 mb-2">Processes</h3>
            {processes.length === 0 ? (
              <div className="text-center text-gray-500 text-sm py-4">No processes available</div>
            ) : (
              <div className="space-y-2">
                {processes.map((process) => (
                  <div
                    key={process.id}
                    className={`flex items-center justify-between bg-os-light rounded-md p-2 text-sm ${
                      simulation.deadlockDetected && process.state === "waiting" ? "border border-os-red" : ""
                    }`}
                  >
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: process.color }} />
                      <span className="text-white">{process.name}</span>
                    </div>
                    <div className="flex space-x-1">
                      {resources.map((resource) => (
                        <Tooltip key={resource.id}>
                          <TooltipTrigger>
                            <button
                              onClick={() => handleAllocateResource(process.id, resource.id)}
                              className={`text-xs ${
                                resource.available === 0
                                  ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                                  : "bg-os-green/20 text-os-green hover:bg-os-green/30"
                              } px-1 rounded`}
                              disabled={resource.available === 0}
                            >
                              {resource.name}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              {resource.available === 0
                                ? `No ${resource.name} available`
                                : `Allocate ${resource.name} to ${process.name}`}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-os-darker rounded-md border border-os-light p-2 h-40 overflow-y-auto">
            <h3 className="text-sm font-bold text-gray-300 mb-2">Resources</h3>
            {resources.length === 0 ? (
              <div className="text-center text-gray-500 text-sm py-4">No resources available. Click + to add.</div>
            ) : (
              <div className="space-y-2">
                {resources.map((resource) => (
                  <div
                    key={resource.id}
                    className={`flex items-center justify-between bg-os-light rounded-md p-2 text-sm ${
                      simulation.deadlockDetected && resource.available === 0 ? "border border-os-red" : ""
                    }`}
                  >
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-os-green rounded-sm mr-2" />
                      <span className="text-white">{resource.name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs ${resource.available === 0 ? "text-os-red" : "text-gray-400"}`}>
                        {resource.available}/{resource.total} available
                      </span>
                      {Object.entries(resource.allocated).map(([processId, amount]) => {
                        const process = processes.find((p) => p.id === processId)
                        if (!process) return null

                        return (
                          <Tooltip key={processId}>
                            <TooltipTrigger>
                              <button
                                onClick={() => handleReleaseResource(processId, resource.id)}
                                className="flex items-center text-xs bg-os-red/20 text-os-red px-1 rounded hover:bg-os-red/30"
                              >
                                <div className="w-2 h-2 rounded-full mr-1" style={{ backgroundColor: process.color }} />
                                <Trash2 size={10} />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                Release {resource.name} from {process.name}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Banker's Algorithm Modal */}
        <BankersAlgorithmModal isOpen={isBankersModalOpen} onClose={() => setBankersModalOpen(false)} />
      </motion.div>
    </TooltipProvider>
  )
}
