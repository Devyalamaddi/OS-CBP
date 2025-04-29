// Mock API service for backend integration
// In a production environment, these would be replaced with real API calls

import { useStore } from "@/lib/store"

// Types
type User = {
  id: string
  name: string
  email: string
  rollNumber?: string
}

type AuthResponse = {
  success: boolean
  token?: string
  user?: User
  error?: string
}

type ScoreData = {
  userId: string
  level: number
  score: number
  completionTime: number
  date: string
}

type LeaderboardEntry = {
  id: number
  name: string
  rollNumber: string
  score: number
  level: number
}

// Mock user data
const mockUsers: User[] = [
  { id: "user1", name: "Alice", email: "alice@example.com", rollNumber: "CS2001" },
  { id: "user2", name: "Bob", email: "bob@example.com", rollNumber: "CS2002" },
  { id: "user3", name: "Charlie", email: "charlie@example.com", rollNumber: "CS2003" },
]

// Mock scores data
const mockScores: ScoreData[] = [
  { userId: "user1", level: 1, score: 850, completionTime: 120, date: "2023-05-10" },
  { userId: "user1", level: 2, score: 720, completionTime: 180, date: "2023-05-11" },
  { userId: "user2", level: 1, score: 920, completionTime: 90, date: "2023-05-09" },
  { userId: "user3", level: 1, score: 780, completionTime: 150, date: "2023-05-12" },
  { userId: "user3", level: 2, score: 650, completionTime: 200, date: "2023-05-13" },
]

// Mock leaderboard data
const mockLeaderboard: LeaderboardEntry[] = [
  { id: 1, name: "Alice", rollNumber: "CS2001", score: 950, level: 3 },
  { id: 2, name: "Bob", rollNumber: "CS2002", score: 920, level: 3 },
  { id: 3, name: "Charlie", rollNumber: "CS2003", score: 880, level: 3 },
  { id: 4, name: "David", rollNumber: "CS2004", score: 850, level: 3 },
  { id: 5, name: "Eve", rollNumber: "CS2005", score: 820, level: 3 },
  { id: 6, name: "Frank", rollNumber: "CS2006", score: 780, level: 2 },
  { id: 7, name: "Grace", rollNumber: "CS2007", score: 750, level: 2 },
  { id: 8, name: "Heidi", rollNumber: "CS2008", score: 720, level: 2 },
  { id: 9, name: "Ivan", rollNumber: "CS2009", score: 680, level: 2 },
  { id: 10, name: "Judy", rollNumber: "CS2010", score: 650, level: 2 },
]

// Mock JWT token
const generateToken = (user: User): string => {
  // In a real app, this would use JWT
  return `mock-token-${user.id}-${Date.now()}`
}

// Authentication API
export const authAPI = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 800))

    // Find user by email
    const user = mockUsers.find((u) => u.email === email)

    if (!user) {
      return { success: false, error: "Invalid email or password" }
    }

    // In a real app, you would verify the password
    // For mock purposes, we'll accept any password

    const token = generateToken(user)

    // Store in localStorage for persistence
    localStorage.setItem("os_simulator_token", token)
    localStorage.setItem("os_simulator_user", JSON.stringify(user))

    return { success: true, token, user }
  },

  register: async (name: string, email: string, rollNumber: string, password: string): Promise<AuthResponse> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Check if email already exists
    if (mockUsers.some((u) => u.email === email)) {
      return { success: false, error: "Email already in use" }
    }

    // Create new user
    const newUser: User = {
      id: `user${mockUsers.length + 1}`,
      name,
      email,
      rollNumber,
    }

    // Add to mock database
    mockUsers.push(newUser)

    const token = generateToken(newUser)

    // Store in localStorage for persistence
    localStorage.setItem("os_simulator_token", token)
    localStorage.setItem("os_simulator_user", JSON.stringify(newUser))

    return { success: true, token, user: newUser }
  },

  logout: async (): Promise<{ success: boolean }> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 300))

    // Clear localStorage
    localStorage.removeItem("os_simulator_token")
    localStorage.removeItem("os_simulator_user")

    return { success: true }
  },

  getCurrentUser: async (): Promise<User | null> => {
    // Get user from localStorage
    const userJson = localStorage.getItem("os_simulator_user")

    if (!userJson) {
      return null
    }

    try {
      return JSON.parse(userJson) as User
    } catch (error) {
      return null
    }
  },
}

// Scores API
export const scoresAPI = {
  saveScore: async (levelId: number, score: number, completionTime: number): Promise<{ success: boolean }> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Get current user
    const userJson = localStorage.getItem("os_simulator_user")
    if (!userJson) {
      return { success: false }
    }

    const user = JSON.parse(userJson) as User

    // Create score entry
    const scoreData: ScoreData = {
      userId: user.id,
      level: levelId,
      score,
      completionTime,
      date: new Date().toISOString().split("T")[0],
    }

    // Add to mock database
    mockScores.push(scoreData)

    // Update game metrics in store
    const currentBestScore = useStore.getState().gameMetrics.bestScores[levelId] || 0

    if (score > currentBestScore) {
      useStore.setState((state) => ({
        gameMetrics: {
          ...state.gameMetrics,
          bestScores: {
            ...state.gameMetrics.bestScores,
            [levelId]: score,
          },
        },
      }))
    }

    return { success: true }
  },

  getUserScores: async (userId?: string): Promise<ScoreData[]> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 400))

    // If no userId provided, get current user
    if (!userId) {
      const userJson = localStorage.getItem("os_simulator_user")
      if (!userJson) {
        return []
      }

      const user = JSON.parse(userJson) as User
      userId = user.id
    }

    // Filter scores by userId
    return mockScores.filter((score) => score.userId === userId)
  },

  getLeaderboard: async (level?: number, limit = 10): Promise<LeaderboardEntry[]> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 600))

    // Filter by level if provided
    let leaderboard = [...mockLeaderboard]

    if (level) {
      leaderboard = leaderboard.filter((entry) => entry.level === level)
    }

    // Sort by score (descending)
    leaderboard.sort((a, b) => b.score - a.score)

    // Limit results
    return leaderboard.slice(0, limit)
  },
}

// Challenges API
export const challengesAPI = {
  getChallenges: async () => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 700))

    // In a real app, this would fetch from a database
    // For now, we'll use the mock data from the useChallenges hook
    return []
  },

  getChallenge: async (levelId: number) => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 400))

    // In a real app, this would fetch a specific challenge
    return null
  },

  submitChallenge: async (levelId: number, solution: any): Promise<{ success: boolean; score?: number }> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 800))

    // In a real app, this would validate the solution on the server
    // For now, we'll assume it's correct (validation happens client-side)

    // Calculate a score based on level
    const score = levelId * 100 + Math.floor(Math.random() * 50)

    // Update user's progress
    const userJson = localStorage.getItem("os_simulator_user")
    if (userJson) {
      const user = JSON.parse(userJson) as User

      // Add to mock scores
      mockScores.push({
        userId: user.id,
        level: levelId,
        score,
        completionTime: Math.floor(Math.random() * 300) + 60, // Random time between 60-360 seconds
        date: new Date().toISOString().split("T")[0],
      })
    }

    return { success: true, score }
  },
}

// User progress API
export const progressAPI = {
  getUserProgress: async (
    userId?: string,
  ): Promise<{ levelsCompleted: number; bestScores: Record<number, number> }> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500))

    // If no userId provided, get current user
    if (!userId) {
      const userJson = localStorage.getItem("os_simulator_user")
      if (!userJson) {
        return { levelsCompleted: 0, bestScores: {} }
      }

      const user = JSON.parse(userJson) as User
      userId = user.id
    }

    // Get user scores
    const userScores = mockScores.filter((score) => score.userId === userId)

    // Calculate levels completed
    const completedLevels = new Set(userScores.map((score) => score.level))

    // Calculate best scores per level
    const bestScores: Record<number, number> = {}

    userScores.forEach((score) => {
      if (!bestScores[score.level] || score.score > bestScores[score.level]) {
        bestScores[score.level] = score.score
      }
    })

    return {
      levelsCompleted: completedLevels.size,
      bestScores,
    }
  },

  updateUserProgress: async (progress: { levelsCompleted?: number; bestScores?: Record<number, number> }): Promise<{
    success: boolean
  }> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 400))

    // In a real app, this would update the user's progress in the database
    // For now, we'll just update the store

    if (progress.levelsCompleted !== undefined || progress.bestScores !== undefined) {
      useStore.setState((state) => ({
        gameMetrics: {
          ...state.gameMetrics,
          ...(progress.levelsCompleted !== undefined ? { levelsCompleted: progress.levelsCompleted } : {}),
          ...(progress.bestScores !== undefined
            ? { bestScores: { ...state.gameMetrics.bestScores, ...progress.bestScores } }
            : {}),
        },
      }))
    }

    return { success: true }
  },
}
