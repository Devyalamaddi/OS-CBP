# Backend API Routes Documentation

This document outlines all the API routes required for the OS Resource Allocation Simulator.

## Authentication

### Register User

- **Route**: `POST /api/auth/register`
- **Description**: Register a new user
- **Request Body**:
  ```json
  {
    "name": "John Doe",
    "email": "john.doe@example.com",
    "rollNumber": "CS2001",
    "password": "securepassword"
  }
