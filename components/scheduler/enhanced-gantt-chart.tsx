"use client"

import { useEffect, useRef, useState } from "react"
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

export function EnhancedGanttChart() {
  const { processes, simulation } = useStore()
  const svgRef = useRef<SVGSVGElement>(null)
  const [executionData, setExecutionData] = useState<ProcessExecution[]>([])
  const [chartCleared, setChartCleared] = useState(false)

  // Update execution data based on the current processes and algorithm
  useEffect(() => {
    // If a clear signal is received, reset the execution data
    const storeState = useStore.getState()
    if (chartCleared) {
      setExecutionData([])
      setChartCleared(false)
      return
    }

    if (!simulation.isRunning || processes.length === 0) return

    // Find the currently running process
    const runningProcess = processes.find((p) => p.state === "running")

    if (runningProcess) {
      const now = simulation.currentTime
      const lastExecution = executionData[executionData.length - 1]

      // If the last execution is for a different process or there's no execution yet
      if (!lastExecution || lastExecution.id !== runningProcess.id) {
        // Calculate wait time
        const waitTime = now - runningProcess.arrivalTime

        // Add new execution
        setExecutionData((prevData) => [
          ...prevData,
          {
            id: runningProcess.id,
            name: runningProcess.name,
            color: runningProcess.color,
            start: now,
            end: now + 0.1, // Will be updated as process continues running
            waitTime: Math.max(0, waitTime),
            turnaroundTime: 0, // Will be calculated when process finishes
          },
        ])
      } else {
        // Update the end time of the current execution
        setExecutionData((prevData) =>
          prevData.map((entry, index) => (index === prevData.length - 1 ? { ...entry, end: now } : entry)),
        )
      }
    }
  }, [processes, simulation.currentTime, simulation.isRunning, chartCleared])

  // Listen for chart clear signals
  useEffect(() => {
    const unsubscribe = useStore.subscribe(
      () => {
        setChartCleared(true)
      }
    )

    return () => unsubscribe()
  }, [])

  // Render the Gantt chart
  useEffect(() => {
    if (!svgRef.current || executionData.length === 0) return

    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove()

    const margin = { top: 20, right: 20, bottom: 30, left: 60 }
    const width = svgRef.current.clientWidth - margin.left - margin.right
    const height = svgRef.current.clientHeight - margin.top - margin.bottom

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`)

    // Get unique process IDs
    const processIds = Array.from(new Set(executionData.map((d) => d.id)))

    // Map processes to their names
    const processNames = processIds.map((id) => {
      const process = processes.find((p) => p.id === id)
      return process ? process.name : id
    })

    // Create scales
    const xScale = d3
      .scaleLinear()
      .domain([0, Math.max(10, d3.max(executionData, (d) => d.end) || 10)])
      .range([0, width])

    const yScale = d3.scaleBand().domain(processIds).range([0, height]).padding(0.3)

    // Add X axis - 1 unit = 1 time unit
    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(
        d3
          .axisBottom(xScale)
          .ticks(Math.min(20, Math.max(10, d3.max(executionData, (d) => d.end) || 10)))
          .tickFormat((d) => `${d}`),
      )
      .attr("color", "#888")
      .append("text")
      .attr("fill", "#888")
      .attr("x", width / 2)
      .attr("y", 25)
      .attr("text-anchor", "middle")
      .text("Time Units")

    // Add Y axis with process names
    g.append("g")
      .call(d3.axisLeft(yScale).tickFormat((id, i) => processNames[i] || id.toString()))
      .attr("color", "#888")

    // Add grid lines
    g.append("g")
      .attr("class", "grid")
      .attr("transform", `translate(0,${height})`)
      .call(
        d3
          .axisBottom(xScale)
          .ticks(Math.min(20, Math.max(10, d3.max(executionData, (d) => d.end) || 10)))
          .tickSize(-height)
          .tickFormat(() => ""),
      )
      .attr("color", "#333")
      .attr("opacity", 0.2)

    // Group execution data by process ID
    const executionsByProcess = d3.group(executionData, (d) => d.id)

    // Add bars for each process execution
    executionsByProcess.forEach((executions, processId) => {
      g.selectAll(`.bar-${processId}`)
        .data(executions)
        .enter()
        .append("rect")
        .attr("class", `bar-${processId}`)
        .attr("x", (d) => xScale(d.start))
        .attr("y", yScale(processId) || 0)
        .attr("width", (d) => Math.max(2, xScale(d.end) - xScale(d.start))) // Minimum width for visibility
        .attr("height", yScale.bandwidth())
        .attr("fill", (d) => d.color)
        .attr("rx", 4)
        .attr("ry", 4)
        .attr("stroke", "#000")
        .attr("stroke-width", 1)
        .append("title")
        .text(
          (d) =>
            `${d.name}\nStart: ${d.start.toFixed(1)}\nEnd: ${d.end.toFixed(1)}\nDuration: ${(d.end - d.start).toFixed(1)}`,
        )
    })

    // Add time labels for longer executions
    executionData.forEach((d) => {
      const width = xScale(d.end) - xScale(d.start)
      if (width > 30) {
        // Only add labels if there's enough space
        g.append("text")
          .attr("x", xScale(d.start) + width / 2)
          .attr("y", (yScale(d.id) || 0) + yScale.bandwidth() / 2 + 4)
          .attr("text-anchor", "middle")
          .attr("fill", "white")
          .attr("font-size", "10px")
          .text((d.end - d.start).toFixed(1))
      }
    })

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
  }, [executionData, simulation.currentTime, simulation.isRunning, processes])

  return (
    <div className="h-full w-full">
      {executionData.length === 0 ? (
        <div className="h-full w-full flex items-center justify-center text-gray-500">No processes executed yet</div>
      ) : (
        <svg ref={svgRef} width="100%" height="100%" />
      )}
    </div>
  )
}
