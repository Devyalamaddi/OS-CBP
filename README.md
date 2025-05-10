# OS Resource Allocation Simulator

An educational game built with Next.js to help users learn core Operating System concepts through interactive simulations. This project focuses on visualizing and controlling OS concepts such as process lifecycle, CPU scheduling, deadlock management, and resource allocation.

## Team Details

| Name       | Roll Number   |
|------------|---------------|
| Nagarjuna  | 23071A05K8    |
| Sri Hasnika| 23071A05K9    |
| Dhruvan    | 23071A05M1    |
| Devendra   | 23071A05M2    |
| Harsha     | 23071A05M3    |

## Video Demo

You can watch the project demo video here: [Demo Video Link](https://drive.google.com/file/d/1jqKKhFplnjuBPzTFmvBKK46svn2cjnPT/view?usp=sharing)

## Features

- Interactive simulation of OS resource allocation and process management
- Visualize process lifecycle from creation to termination
- Experiment with different CPU scheduling algorithms
- Create, detect, and resolve deadlocks in resource allocation scenarios
- User authentication and leaderboard tracking
- Responsive and modern UI built with Tailwind CSS and Framer Motion

## Tech Stack

- Next.js (React framework)
- Node.js with Express for backend API routes
- Tailwind CSS for styling
- Framer Motion for animations
- JSON Web Tokens (JWT) for authentication

## Setup and Installation

### Prerequisites

- Node.js (v16 or higher recommended)
- npm (comes with Node.js) or pnpm

### Installation Steps

1. Clone the repository:

```bash
git clone <repository-url>
cd os-simulator
```

2. Install dependencies:

Using npm:

```bash
npm install
```

Or using pnpm:

```bash
pnpm install
```

3. Set environment variables:

Create a `.env` file in the root directory and add the following:

```
JWT_SECRET=your_jwt_secret_key
```

Replace `your_jwt_secret_key` with a secure secret string.

4. Run the development server:

Using npm:

```bash
npm run dev
```

Or using pnpm:

```bash
pnpm dev
```

5. Open your browser and navigate to:

```
http://localhost:3000
```

## Project Structure

- `app/` - Next.js app directory containing pages and layouts
- `components/` - Reusable React UI components
- `hooks/` - Custom React hooks
- `lib/` - Utility libraries and context providers
- `server/routes/` - Express backend API route handlers
- `public/` - Static assets like images and icons
- `styles/` - Global and component-specific styles

## Usage

- Navigate to the Simulation page to start interactive OS simulations
- Use the Login page to authenticate and track your progress
- Check the Leaderboard to see top users and scores

## Contributing

Contributions are welcome! Please open issues or submit pull requests for improvements or bug fixes.

## License

This project is licensed under the MIT License.

---

Built with ❤️ for educational purposes.
