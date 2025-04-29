const express = require("express")
const router = express.Router()

// Get all levels
router.get("/", (req, res) => {
  // In a real app, you would fetch from a database
  // For demo purposes, we'll return sample data

  res.json({
    levels: [
      {
        id: 1,
        name: "Basics",
        description: "Learn the basics of process management",
        unlocked: true,
      },
      {
        id: 2,
        name: "Deadlocks",
        description: "Understand deadlocks and how to handle them",
        unlocked: false,
      },
      {
        id: 3,
        name: "Advanced",
        description: "Advanced concepts and challenges",
        unlocked: false,
      },
    ],
  })
})

// Get level details
router.get("/:id", (req, res) => {
  const { id } = req.params

  // In a real app, you would fetch from a database
  // For demo purposes, we'll return sample data

  res.json({
    id: Number.parseInt(id),
    name: "Basics",
    description: "Learn the basics of process management",
    objectives: ["Create 3 processes", "Run all processes to completion", "Achieve 80% CPU utilization"],
    initialState: {
      processes: [],
      resources: [],
      simulation: {
        isRunning: false,
        speed: 1,
        currentTime: 0,
        algorithm: "FCFS",
        timeQuantum: 2,
        score: 0,
        level: Number.parseInt(id),
        deadlockDetected: false,
      },
    },
  })
})

module.exports = router
