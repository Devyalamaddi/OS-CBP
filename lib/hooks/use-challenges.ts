"use client"

import { useState, useEffect } from "react"

// Mock challenges data
const mockChallenges = [
  {
    id: "level1",
    title: "Process Scheduling Basics",
    type: "scheduling",
    description:
      "Select the most appropriate scheduling algorithm for the given set of processes to minimize average waiting time.",
    hint: "Consider the burst times of each process and how they affect waiting time.",
    processes: [
      { id: "p1", name: "Process 1", arrivalTime: 0, burstTime: 6, priority: 3 },
      { id: "p2", name: "Process 2", arrivalTime: 1, burstTime: 3, priority: 1 },
      { id: "p3", name: "Process 3", arrivalTime: 2, burstTime: 8, priority: 2 },
      { id: "p4", name: "Process 4", arrivalTime: 3, burstTime: 2, priority: 4 },
    ],
    initialAlgorithm: "",
    initialOrder: ["p1", "p2", "p3", "p4"],
    rrOrder: ["p1", "p2", "p3", "p4", "p1", "p3", "p1"],
    solution: {
      algorithm: "SJF",
      checkOrder: true,
      order: ["p4", "p2", "p1", "p3"],
    },
  },
  {
    id: "level2",
    title: "Resource Allocation Challenge",
    type: "resource",
    description: "Allocate resources to processes to maximize utilization without causing a deadlock.",
    hint: "Ensure that no process is waiting for a resource held by another waiting process.",
    resources: [
      { id: "r1", name: "CPU", units: 3 },
      { id: "r2", name: "Memory", units: 5 },
      { id: "r3", name: "Disk", units: 2 },
    ],
    processes: [
      { id: "p1", name: "Process A", needs: ["CPU", "Memory"] },
      { id: "p2", name: "Process B", needs: ["Memory", "Disk"] },
      { id: "p3", name: "Process C", needs: ["CPU", "Disk"] },
    ],
    initialAllocation: {
      p1: [],
      p2: [],
      p3: [],
    },
    solution: {
      p1: ["r1", "r2"],
      p2: ["r2", "r3"],
      p3: ["r1", "r3"],
    },
    deadlockScenarios: [
      {
        p1: ["r1"],
        p2: ["r2"],
        p3: ["r3"],
      },
    ],
  },
  {
    id: "level3",
    title: "Deadlock Avoidance",
    type: "deadlock",
    description: "Given the current allocation and request matrices, find a safe sequence that avoids deadlock.",
    hint: "Apply the Banker's Algorithm to find a sequence where each process can complete without causing deadlock.",
    processes: [
      { id: "p1", name: "Process 1" },
      { id: "p2", name: "Process 2" },
      { id: "p3", name: "Process 3" },
      { id: "p4", name: "Process 4" },
    ],
    resources: [
      { id: "r1", name: "Resource A" },
      { id: "r2", name: "Resource B" },
      { id: "r3", name: "Resource C" },
    ],
    allocation: {
      p1: { r1: 0, r2: 1, r3: 0 },
      p2: { r1: 2, r2: 0, r3: 0 },
      p3: { r1: 3, r2: 0, r3: 2 },
      p4: { r1: 2, r2: 1, r3: 1 },
    },
    request: {
      p1: { r1: 0, r2: 0, r3: 0 },
      p2: { r1: 2, r2: 0, r3: 2 },
      p3: { r1: 0, r2: 1, r3: 0 },
      p4: { r1: 1, r2: 0, r3: 0 },
    },
    available: {
      r1: 3,
      r2: 3,
      r3: 2,
    },
    readOnly: true,
    solution: ["p1", "p3", "p4", "p2"],
  },
  {
    id: "level4",
    title: "Priority Scheduling",
    type: "scheduling",
    description:
      "Determine the optimal scheduling algorithm and execution order for processes with different priorities.",
    hint: "Consider both the priority values and whether preemption would improve performance.",
    processes: [
      { id: "p1", name: "Process 1", arrivalTime: 0, burstTime: 5, priority: 2 },
      { id: "p2", name: "Process 2", arrivalTime: 1, burstTime: 3, priority: 1 },
      { id: "p3", name: "Process 3", arrivalTime: 2, burstTime: 4, priority: 3 },
      { id: "p4", name: "Process 4", arrivalTime: 3, burstTime: 2, priority: 4 },
    ],
    initialAlgorithm: "",
    initialOrder: ["p1", "p2", "p3", "p4"],
    solution: {
      algorithm: "Priority",
      checkOrder: true,
      order: ["p4", "p3", "p1", "p2"],
    },
  },
  {
    id: "level5",
    title: "Complex Resource Management",
    type: "resource",
    description: "Manage resources in a complex system with multiple interdependent processes.",
    hint: "Consider the order of resource allocation to prevent circular wait conditions.",
    resources: [
      { id: "r1", name: "CPU", units: 4 },
      { id: "r2", name: "Memory", units: 8 },
      { id: "r3", name: "Disk", units: 3 },
      { id: "r4", name: "Network", units: 2 },
    ],
    processes: [
      { id: "p1", name: "Web Server", needs: ["CPU", "Memory", "Network"] },
      { id: "p2", name: "Database", needs: ["CPU", "Memory", "Disk"] },
      { id: "p3", name: "File System", needs: ["CPU", "Disk"] },
      { id: "p4", name: "User Interface", needs: ["CPU", "Memory"] },
    ],
    initialAllocation: {
      p1: [],
      p2: [],
      p3: [],
      p4: [],
    },
    solution: {
      p1: ["r1", "r2", "r4"],
      p2: ["r1", "r2", "r3"],
      p3: ["r1", "r3"],
      p4: ["r1", "r2"],
    },
  },
  {
    id: "level6",
    title: "Advanced Banker's Algorithm",
    type: "deadlock",
    description: "Apply the Banker's Algorithm to a complex system with multiple resource types.",
    hint: "Calculate the need matrix and check if each process can complete with available resources.",
    processes: [
      { id: "p1", name: "Process 1" },
      { id: "p2", name: "Process 2" },
      { id: "p3", name: "Process 3" },
      { id: "p4", name: "Process 4" },
      { id: "p5", name: "Process 5" },
    ],
    resources: [
      { id: "r1", name: "Resource A" },
      { id: "r2", name: "Resource B" },
      { id: "r3", name: "Resource C" },
      { id: "r4", name: "Resource D" },
    ],
    allocation: {
      p1: { r1: 0, r2: 0, r3: 1, r4: 2 },
      p2: { r1: 1, r2: 0, r3: 0, r4: 0 },
      p3: { r1: 1, r2: 3, r3: 5, r4: 4 },
      p4: { r1: 0, r2: 6, r3: 3, r4: 2 },
      p5: { r1: 0, r2: 0, r3: 1, r4: 4 },
    },
    request: {
      p1: { r1: 0, r2: 0, r3: 1, r4: 2 },
      p2: { r1: 1, r2: 7, r3: 5, r4: 0 },
      p3: { r1: 2, r2: 0, r3: 0, r4: 0 },
      p4: { r1: 0, r2: 6, r3: 0, r4: 2 },
      p5: { r1: 0, r2: 6, r3: 0, r4: 0 },
    },
    available: {
      r1: 1,
      r2: 5,
      r3: 2,
      r4: 0,
    },
    readOnly: true,
    solution: ["p2", "p5", "p1", "p3", "p4"],
  },
  {
    id: "level7",
    title: "Round Robin Scheduling",
    type: "scheduling",
    description: "Optimize a Round Robin scheduling algorithm by selecting the appropriate time quantum.",
    hint: "Consider how the time quantum affects context switching overhead and response time.",
    processes: [
      { id: "p1", name: "Process 1", arrivalTime: 0, burstTime: 8, priority: 3 },
      { id: "p2", name: "Process 2", arrivalTime: 1, burstTime: 4, priority: 1 },
      { id: "p3", name: "Process 3", arrivalTime: 2, burstTime: 9, priority: 2 },
      { id: "p4", name: "Process 4", arrivalTime: 3, burstTime: 5, priority: 4 },
    ],
    initialAlgorithm: "",
    initialOrder: ["p1", "p2", "p3", "p4"],
    rrOrder: ["p1", "p2", "p3", "p4", "p1", "p2", "p3", "p4", "p1", "p3"],
    solution: {
      algorithm: "RR",
      checkOrder: false,
    },
  },
  {
    id: "level8",
    title: "Deadlock Detection and Recovery",
    type: "deadlock",
    description:
      "Detect a deadlock in the system and determine the minimum number of processes to terminate to resolve it.",
    hint: "Look for cycles in the resource allocation graph and identify which processes to terminate.",
    processes: [
      { id: "p1", name: "Process 1" },
      { id: "p2", name: "Process 2" },
      { id: "p3", name: "Process 3" },
      { id: "p4", name: "Process 4" },
    ],
    resources: [
      { id: "r1", name: "Resource A" },
      { id: "r2", name: "Resource B" },
      { id: "r3", name: "Resource C" },
    ],
    allocation: {
      p1: { r1: 1, r2: 0, r3: 0 },
      p2: { r1: 0, r2: 1, r3: 0 },
      p3: { r1: 0, r2: 0, r3: 1 },
      p4: { r1: 0, r2: 0, r3: 0 },
    },
    request: {
      p1: { r1: 0, r2: 1, r3: 0 },
      p2: { r1: 0, r2: 0, r3: 1 },
      p3: { r1: 1, r2: 0, r3: 0 },
      p4: { r1: 0, r2: 1, r3: 0 },
    },
    available: {
      r1: 0,
      r2: 0,
      r3: 0,
    },
    readOnly: true,
    solution: ["p4", "p1", "p2", "p3"], // This represents the order after terminating p3
  },
  {
    id: "level9",
    title: "Multi-Level Feedback Queue",
    type: "scheduling",
    description:
      "Design a multi-level feedback queue scheduling system for a mix of I/O-bound and CPU-bound processes.",
    hint: "Processes that use less CPU time should be given higher priority to improve response time.",
    processes: [
      { id: "p1", name: "Process 1", arrivalTime: 0, burstTime: 10, priority: 2, type: "CPU-bound" },
      { id: "p2", name: "Process 2", arrivalTime: 1, burstTime: 3, priority: 3, type: "I/O-bound" },
      { id: "p3", name: "Process 3", arrivalTime: 2, burstTime: 2, priority: 1, type: "I/O-bound" },
      { id: "p4", name: "Process 4", arrivalTime: 3, burstTime: 8, priority: 4, type: "CPU-bound" },
      { id: "p5", name: "Process 5", arrivalTime: 4, burstTime: 4, priority: 5, type: "I/O-bound" },
    ],
    initialAlgorithm: "",
    initialOrder: ["p1", "p2", "p3", "p4", "p5"],
    solution: {
      algorithm: "Priority",
      checkOrder: true,
      order: ["p5", "p4", "p2", "p1", "p3"],
    },
  },
  {
    id: "level10",
    title: "Comprehensive System Optimization",
    type: "resource",
    description: "Optimize a complex system with multiple resources, processes, and scheduling constraints.",
    hint: "Balance resource allocation, scheduling algorithm choice, and deadlock avoidance for optimal performance.",
    resources: [
      { id: "r1", name: "CPU", units: 8 },
      { id: "r2", name: "Memory", units: 16 },
      { id: "r3", name: "Disk", units: 6 },
      { id: "r4", name: "Network", units: 4 },
      { id: "r5", name: "GPU", units: 2 },
    ],
    processes: [
      { id: "p1", name: "Web Server", needs: ["CPU", "Memory", "Network"] },
      { id: "p2", name: "Database", needs: ["CPU", "Memory", "Disk"] },
      { id: "p3", name: "AI Model", needs: ["CPU", "Memory", "GPU"] },
      { id: "p4", name: "File System", needs: ["CPU", "Disk"] },
      { id: "p5", name: "User Interface", needs: ["CPU", "Memory", "GPU"] },
      { id: "p6", name: "Background Task", needs: ["CPU", "Memory"] },
    ],
    initialAllocation: {
      p1: [],
      p2: [],
      p3: [],
      p4: [],
      p5: [],
      p6: [],
    },
    solution: {
      p1: ["r1", "r2", "r4"],
      p2: ["r1", "r2", "r3"],
      p3: ["r1", "r2", "r5"],
      p4: ["r1", "r3"],
      p5: ["r1", "r2", "r5"],
      p6: ["r1", "r2"],
    },
  },
]

export function useChallenges() {
  const [challenges, setChallenges] = useState(mockChallenges)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // In a real app, this would fetch challenges from an API
    const fetchChallenges = async () => {
      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 500))

        // In a real app, you would fetch from an API endpoint
        // const response = await fetch('/api/challenges')
        // const data = await response.json()
        // setChallenges(data)

        // For now, we'll use the mock data
        setChallenges(mockChallenges)
        setLoading(false)
      } catch (err) {
        setError("Failed to load challenges")
        setLoading(false)
      }
    }

    fetchChallenges()
  }, [])

  return { challenges, loading, error }
}
