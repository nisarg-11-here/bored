# Bored - AI-Powered Task Management App

A Next.js-based task management application that uses AI to generate personalized tasks based on your mood, energy level, and available time. Perfect for combating boredom with intelligent task suggestions!

## Features

- **AI-Powered Task Generation**: Get personalized task suggestions based on your mood, energy level, and available time
- **Task Management**: Create, edit, complete, and delete tasks with categories and priorities
- **Beautiful UI**: Modern, responsive design with smooth animations
- **Real-time Updates**: Instant task updates with optimistic UI
- **Category System**: Organize tasks by personal, work, health, learning, creative, and social categories
- **Priority Levels**: Set low, medium, or high priority for tasks

## Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: MongoDB Atlas with Mongoose ODM
- **AI**: OpenAI GPT-4 for intelligent task generation
- **Icons**: Lucide React
- **Deployment**: Vercel (recommended)

## Getting Started

### Prerequisites

- Node.js 18.18.0 or higher
- MongoDB Atlas account
- OpenAI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd bored
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   MONGODB_URI=your_mongodb_atlas_connection_string_here
   OPENAI_API_KEY=your_openai_api_key_here
   ```

4. **Set up MongoDB Atlas**
   - Create a new cluster in MongoDB Atlas
   - Get your connection string
   - Replace `your_mongodb_atlas_connection_string_here` with your actual connection string

5. **Get OpenAI API Key**
   - Sign up at [OpenAI](https://openai.com)
   - Get your API key from the dashboard
   - Replace `your_openai_api_key_here` with your actual API key

6. **Run the development server**
   ```bash
   npm run dev
   ```

7. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

### Creating Tasks
1. Use the "Add New Task" form to create manual tasks
2. Fill in the title, description (optional), category, and priority
3. Click "Add Task" to save

### AI Task Generation
1. Click "Generate AI Tasks" button
2. Select your current mood (happy, neutral, stressed, etc.)
3. Set your energy level (1-10 scale)
4. Specify available time in minutes
5. Click "Generate Tasks" to get AI-suggested activities

### Managing Tasks
- Click the circle icon to mark tasks as complete/incomplete
- Use the trash icon to delete tasks
- AI-generated tasks are marked with a sparkles icon

## API Routes

- `GET /api/tasks` - Fetch all tasks
- `POST /api/tasks` - Create a new task
- `PUT /api/tasks/[id]` - Update a task
- `DELETE /api/tasks/[id]` - Delete a task
- `POST /api/ai/generate-tasks` - Generate AI tasks based on mood/energy/time

## Database Schema

```typescript
interface Task {
  _id: string;
  title: string;
  description?: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  createdAt: Date;
  completedAt?: Date;
  aiGenerated: boolean;
}
```

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Environment Variables for Production

Make sure to set these in your deployment platform:
- `MONGODB_URI`
- `OPENAI_API_KEY`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - feel free to use this project for your own purposes!

## Future Enhancements

- User authentication with NextAuth.js
- Task statistics and progress tracking
- Task scheduling and reminders
- Mobile app version
- Social features and task sharing
- Advanced AI features with task difficulty estimation
