const express = require("express")
const router = express.Router()

// Get all resources
router.get("/", (req, res) => {
  const { sessionId } = req.query

  // In a real app, you would fetch from a database
  // For demo purposes, we'll return sample data

  res.json({
    resources: [
      {
        id: "r-1",
        name: "Resource 1",
        total: 5,
        available: 3,
        allocated: {
          "p-2": 1,
          "p-3": 1,
        },
      },
      {
        id: "r-2",
        name: "Resource 2",
        total: 3,
        available: 3,
        allocated: {},
      },
    ],
  })
})

// Create a new resource
router.post("/", (req, res) => {
  const { sessionId, name, total } = req.body

  // Validate input
  if (!sessionId || !name || !total) {
    return res.status(400).json({ error: "Session ID, name, and total are required" })
  }

  // In a real app, you would store in a database
  // For demo purposes, we'll just return the created resource

  const resource = {
    id: `r-${Date.now()}`,
    name,
    total,
    available: total,
    allocated: {},
  }

  res.json(resource)
})

// Delete a resource
router.delete("/:id", (req, res) => {
  const { id } = req.params

  // In a real app, you would delete from a database
  // For demo purposes, we'll just return success

  res.json({ success: true })
})

module.exports = router
