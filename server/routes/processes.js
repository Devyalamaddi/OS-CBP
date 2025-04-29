const express = require("express")
const router = express.Router()

// Get all processes
router.get("/", (req, res) => {
  const { sessionId } = req.query

  // In a real app, you would fetch from a database
  // For demo purposes, we'll return sample data

  res.json({
    processes: [
      {
        id: "p-1",
        name: "Process 1",
        state: "ready",
        priority: 5,
        burstTime: 8,
        arrivalTime: 0,
        resources: [],
        color: "#4FACFE",
      },
      {
        id: "p-2",
        name: "Process 2",
        state: "running",
        priority: 3,
        burstTime: 4,
        arrivalTime: 1,
        resources: ["r-1"],
        color: "#9D50BB",
      },
    ],
  })
})

// Create a new process
router.post("/", (req, res) => {
  const { sessionId, name, priority, burstTime, arrivalTime } = req.body

  // Validate input
  if (!sessionId || !name) {
    return res.status(400).json({ error: "Session ID and name are required" })
  }

  // In a real app, you would store in a database
  // For demo purposes, we'll just return the created process

  const process = {
    id: `p-${Date.now()}`,
    name,
    state: "new",
    priority: priority || 1,
    burstTime: burstTime || 5,
    arrivalTime: arrivalTime || 0,
    resources: [],
    color: "#4FACFE",
  }

  res.json(process)
})

// Update a process
router.patch("/:id", (req, res) => {
  const { id } = req.params
  const { state } = req.body

  // Validate input
  if (!state) {
    return res.status(400).json({ error: "State is required" })
  }

  // In a real app, you would update in a database
  // For demo purposes, we'll just return the updated process

  const process = {
    id,
    name: "Process 1",
    state,
    priority: 5,
    burstTime: 8,
    arrivalTime: 0,
    resources: ["r-1"],
    color: "#4FACFE",
  }

  res.json(process)
})

// Delete a process
router.delete("/:id", (req, res) => {
  const { id } = req.params

  // In a real app, you would delete from a database
  // For demo purposes, we'll just return success

  res.json({ success: true })
})

module.exports = router
