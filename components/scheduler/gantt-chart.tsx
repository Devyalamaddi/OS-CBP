"use client"

import { useEffect, useRef } from "react"
import * as d3 from "d3"
import { useStore } from "@/lib/store"

type ProcessExecution = {
  id: string
  name: string
  color: string
  start: number
  end: number
  waitTime: number
  turnaroundTime: number
}

export function GanttChart() {
  const { processes, simulation } = useStore()
  const svgRef = useRef<SVGSVGElement>(null)

  // Sample execution data - in a real app, this would be calculated based on the scheduling algorithm
  const executionData = useRef<ProcessExecution[]>([])

  // Update execution data based on the current processes and algorithm
  useEffect(() => {
    if (!simulation.isRunning || processes.length === 0) return

    // This is a simplified simulation - in a real app, you would implement the actual scheduling algorithms
    const runningProcess = processes.find((p) => p.state === "running")

    if (runningProcess) {
      const now = simulation.currentTime
      const lastExecution = executionData.current[executionData.current.length - 1]

      // If the last execution is for a different process or there's no execution yet
      if (!lastExecution || lastExecution.id !== runningProcess.id) {
        // Calculate wait time (simplified)
        const waitTime = now - runningProcess.arrivalTime

        // Add new execution
        executionData.current.push({
          id: runningProcess.id,
          name: runningProcess.name,
          color: runningProcess.color,
          start: now,
          end: now + 0.1, // Will be updated as process continues running
          waitTime: Math.max(0, waitTime),
          turnaroundTime: 0, // Will be calculated when process finishes
        })
      } else {
        // Update the end time of the current execution
        lastExecution.end = now
      }
    }
  }, [processes, simulation.currentTime, simulation.isRunning, simulation.algorithm])

  // Render the Gantt chart
  useEffect(() => {
    if (!svgRef.current || executionData.current.length === 0) return

    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove()

    const margin = { top: 20, right: 20, bottom: 30, left: 40 }
    const width = svgRef.current.clientWidth - margin.left - margin.right
    const height = svgRef.current.clientHeight - margin.top - margin.bottom

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`)

    // Create scales
    const xScale = d3
      .scaleLinear()
      .domain([0, Math.max(10, d3.max(executionData.current, (d) => d.end) || 10)])
      .range([0, width])

    const yScale = d3
      .scaleBand()
      .domain(Array.from(new Set(executionData.current.map((d) => d.id))))
      .range([0, height])
      .padding(0.1)

    // Add X axis
    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(xScale).ticks(10))
      .attr("color", "#888")
      .append("text")
      .attr("fill", "#888")
      .attr("x", width / 2)
      .attr("y", 25)
      .attr("text-anchor", "middle")
      .text("Time")

    // Add Y axis
    g.append("g").call(d3.axisLeft(yScale)).attr("color", "#888")

    // Add bars
    g.selectAll(".bar")
      .data(executionData.current)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", (d) => xScale(d.start))
      .attr("y", (d) => yScale(d.id) || 0)
      .attr("width", (d) => xScale(d.end) - xScale(d.start))
      .attr("height", yScale.bandwidth())
      .attr("fill", (d) => d.color)
      .attr("rx", 4)
      .attr("ry", 4)

    // Add process names
    g.selectAll(".process-label")
      .data(executionData.current)
      .enter()
      .append("text")
      .attr("class", "process-label")
      .attr("x", (d) => xScale(d.start) + 5)
      .attr("y", (d) => (yScale(d.id) || 0) + yScale.bandwidth() / 2 + 5)
      .attr("fill", "white")
      .attr("font-size", "10px")
      .text((d) => d.name)

    // Add current time marker
    if (simulation.isRunning) {
      g.append("line")
        .attr("x1", xScale(simulation.currentTime))
        .attr("x2", xScale(simulation.currentTime))
        .attr("y1", 0)
        .attr("y2", height)
        .attr("stroke", "#ff5e62")
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", "4")
    }
  }, [executionData.current, simulation.currentTime, simulation.isRunning])

  return (
    <div className="h-full w-full">
      {executionData.current.length === 0 ? (
        <div className="h-full w-full flex items-center justify-center text-gray-500">No processes executed yet</div>
      ) : (
        <svg ref={svgRef} width="100%" height="100%" />
      )}
    </div>
  )
}
