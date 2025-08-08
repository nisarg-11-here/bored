# Bored App - Technical Documentation

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture Overview](#architecture-overview)
3. [File Structure](#file-structure)
4. [Technology Stack](#technology-stack)
5. [Database Design](#database-design)
6. [API Routes](#api-routes)
7. [Frontend Components](#frontend-components)
8. [AI Integration](#ai-integration)
9. [State Management](#state-management)
10. [Error Handling](#error-handling)
11. [Environment Configuration](#environment-configuration)
12. [Development Workflow](#development-workflow)
13. [Deployment Guide](#deployment-guide)

---

## 🎯 Project Overview

**Bored** is a Next.js-based task management application that uses AI to generate personalized tasks based on user mood, energy level, and available time. The app helps combat boredom by suggesting engaging activities tailored to the user's current state.

### Key Features
- **AI-Powered Task Generation**: GPT-4 generates personalized tasks
- **Task Management**: Full CRUD operations for tasks
- **Mood-Based Suggestions**: Tasks tailored to user's emotional state
- **Energy Level Consideration**: Activities matching user's energy
- **Time-Aware Recommendations**: Tasks fitting available time
- **Beautiful UI**: Modern, responsive design with Tailwind CSS

---

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   External      │
│   (Next.js)     │◄──►│   (API Routes)  │◄──►│   Services      │
│                 │    │                 │    │                 │
│ • React         │    │ • MongoDB       │    │ • OpenAI API    │
│ • TypeScript    │    │ • Mongoose      │    │ • MongoDB Atlas │
│ • Tailwind CSS  │    │ • Next.js API   │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Data Flow
1. **User Input** → Frontend (React components)
2. **API Calls** → Next.js API Routes
3. **Database Operations** → MongoDB via Mongoose
4. **AI Processing** → OpenAI GPT-4 API
5. **Response** → Frontend state updates

---

## 📁 File Structure

```
bored/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── api/                      # API Routes
│   │   │   ├── tasks/                # Task CRUD operations
│   │   │   │   ├── route.ts          # GET, POST /api/tasks
│   │   │   │   └── [id]/             # Dynamic routes
│   │   │   │       └── route.ts      # PUT, DELETE /api/tasks/[id]
│   │   │   └── ai/                   # AI integration
│   │   │       └── generate-tasks/   # AI task generation
│   │   │           └── route.ts      # POST /api/ai/generate-tasks
│   │   ├── page.tsx                  # Main application page
│   │   ├── layout.tsx                # Root layout
│   │   ├── globals.css               # Global styles
│   │   └── favicon.ico              # App icon
│   ├── lib/                          # Utility libraries
│   │   └── mongodb.ts               # Database connection utility
│   └── models/                       # Database models
│       └── Task.ts                  # Mongoose Task schema
├── public/                           # Static assets
├── .env.local                       # Environment variables
├── package.json                     # Dependencies and scripts
├── tsconfig.json                    # TypeScript configuration
├── tailwind.config.js              # Tailwind CSS configuration
├── next.config.ts                   # Next.js configuration
└── README.md                        # User documentation
```

---

## 🛠️ Technology Stack

### Frontend
- **Next.js 15**: React framework with App Router
- **React 19**: UI library with hooks
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Beautiful icon library

### Backend
- **Next.js API Routes**: Serverless backend functions
- **MongoDB Atlas**: Cloud database service
- **Mongoose**: MongoDB object modeling
- **OpenAI GPT-4**: AI task generation

### Development Tools
- **ESLint**: Code linting
- **TypeScript**: Static type checking
- **Node.js 20**: JavaScript runtime

---

## 🗄️ Database Design

### MongoDB Connection (`src/lib/mongodb.ts`)
```typescript
// Connection caching for performance
let cached: Cached = (global as any).mongoose;

async function dbConnect() {
  if (cached.conn) return cached.conn;
  
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, opts);
  }
  
  cached.conn = await cached.promise;
  return cached.conn;
}
```

### Task Schema (`src/models/Task.ts`)
```typescript
interface ITask {
  _id: string;
  title: string;           // Task title
  description?: string;     // Optional description
  category: string;         // personal, work, health, learning, creative, social
  priority: 'low' | 'medium' | 'high';
  completed: boolean;       // Completion status
  createdAt: Date;         // Creation timestamp
  completedAt?: Date;       // Completion timestamp
  aiGenerated: boolean;     // Whether AI created this task
}

const taskSchema = new mongoose.Schema<ITask>({
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  category: { type: String, required: true, default: 'personal' },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  completed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  completedAt: { type: Date },
  aiGenerated: { type: Boolean, default: false }
});
```

---

## 🔌 API Routes

### Task Management (`src/app/api/tasks/`)

#### GET `/api/tasks` - Fetch All Tasks
```typescript
export async function GET() {
  await dbConnect();
  const tasks = await Task.find({}).sort({ createdAt: -1 });
  return NextResponse.json(tasks);
}
```

#### POST `/api/tasks` - Create New Task
```typescript
export async function POST(request: NextRequest) {
  const body = await request.json();
  await dbConnect();
  const task = await Task.create(body);
  return NextResponse.json(task, { status: 201 });
}
```

### Individual Task Operations (`src/app/api/tasks/[id]/`)

#### PUT `/api/tasks/[id]` - Update Task
```typescript
export async function PUT(request: NextRequest, { params }) {
  const body = await request.json();
  await dbConnect();
  const task = await Task.findByIdAndUpdate(params.id, body, {
    new: true, runValidators: true
  });
  return NextResponse.json(task);
}
```

#### DELETE `/api/tasks/[id]` - Delete Task
```typescript
export async function DELETE(request: NextRequest, { params }) {
  await dbConnect();
  await Task.findByIdAndDelete(params.id);
  return NextResponse.json({ message: 'Task deleted successfully' });
}
```

### AI Integration (`src/app/api/ai/generate-tasks/`)

#### POST `/api/ai/generate-tasks` - Generate AI Tasks
```typescript
export async function POST(request: NextRequest) {
  const { mood, energyLevel, availableTime } = await request.json();
  
  const prompt = `Generate 3 engaging tasks based on:
    Mood: ${mood}
    Energy Level: ${energyLevel}/10
    Available Time: ${availableTime} minutes`;
  
  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.8,
    max_tokens: 500
  });
  
  const tasks = JSON.parse(completion.choices[0]?.message?.content);
  return NextResponse.json(tasks);
}
```

---

## 🎨 Frontend Components

### Main Page (`src/app/page.tsx`)

#### State Management
```typescript
const [tasks, setTasks] = useState<Task[]>([]);
const [newTask, setNewTask] = useState({ 
  title: '', description: '', category: 'personal', priority: 'medium' 
});
const [showAIGenerator, setShowAIGenerator] = useState(false);
const [aiInputs, setAiInputs] = useState({ 
  mood: 'neutral', energyLevel: 5, availableTime: 30 
});
```

#### Key Functions

**fetchTasks()** - Load tasks from API
```typescript
const fetchTasks = async () => {
  try {
    const response = await fetch('/api/tasks');
    const data = await response.json();
    setTasks(Array.isArray(data) ? data : []);
  } catch (error) {
    console.error('Failed to fetch tasks:', error);
    setTasks([]);
  }
};
```

**createTask()** - Add new task
```typescript
const createTask = async () => {
  setIsLoading(true);
  try {
    const response = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTask)
    });
    if (response.ok) {
      const task = await response.json();
      setTasks([task, ...(tasks || [])]);
    }
  } catch (error) {
    console.error('Failed to create task:', error);
  } finally {
    setIsLoading(false);
  }
};
```

**generateAITasks()** - Get AI suggestions
```typescript
const generateAITasks = async () => {
  setIsGenerating(true);
  try {
    const response = await fetch('/api/ai/generate-tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(aiInputs)
    });
    if (response.ok) {
      const aiTasks = await response.json();
      for (const task of aiTasks) {
        const response = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...task, aiGenerated: true })
        });
        if (response.ok) {
          const newTask = await response.json();
          setTasks([newTask, ...(tasks || [])]);
        }
      }
    }
  } catch (error) {
    console.error('Failed to generate AI tasks:', error);
  } finally {
    setIsGenerating(false);
  }
};
```

#### UI Components

**Header Section**
```jsx
<div className="text-center mb-8">
  <h1 className="text-4xl font-bold text-gray-900 mb-2">Bored?</h1>
  <p className="text-gray-600">Let's find something interesting to do!</p>
</div>
```

**AI Task Generator**
```jsx
<button onClick={() => setShowAIGenerator(!showAIGenerator)}>
  <Sparkles className="w-5 h-5" />
  Generate AI Tasks
</button>
```

**Task Creation Form**
```jsx
<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
  <input type="text" placeholder="Task title" />
  <select value={newTask.category}>
    <option value="personal">Personal</option>
    <option value="work">Work</option>
    {/* ... other categories */}
  </select>
  <select value={newTask.priority}>
    <option value="low">Low Priority</option>
    <option value="medium">Medium Priority</option>
    <option value="high">High Priority</option>
  </select>
</div>
```

**Task List**
```jsx
{(tasks || []).map((task) => (
  <div key={task._id} className="bg-white rounded-lg p-4 shadow-md">
    <div className="flex items-start gap-3">
      <button onClick={() => toggleTask(task._id, !task.completed)}>
        {task.completed ? <CheckCircle /> : <Circle />}
      </button>
      <div className="flex-1">
        <h3 className={task.completed ? 'line-through' : ''}>
          {task.title}
          {task.aiGenerated && <Sparkles />}
        </h3>
        {/* Task details */}
      </div>
      <button onClick={() => deleteTask(task._id)}>
        <Trash2 />
      </button>
    </div>
  </div>
))}
```

---

## 🤖 AI Integration

### OpenAI Configuration
```typescript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
```

### Prompt Engineering
The AI prompt is carefully crafted to generate relevant tasks:

```typescript
const prompt = `Generate 3 engaging and personalized tasks to help combat boredom. Consider the following:

Mood: ${mood}
Energy Level: ${energyLevel}/10
Available Time: ${availableTime} minutes

Generate tasks that are:
- Appropriate for the given mood and energy level
- Realistic for the available time
- Engaging and varied (mix of physical, mental, creative, social activities)
- Specific and actionable
- Fun and interesting

Format each task as a JSON object with:
- title: A catchy, specific task title
- description: A brief explanation of what to do
- category: One of [personal, work, health, learning, creative, social]
- priority: One of [low, medium, high] based on energy level and mood

Return only a JSON array of 3 task objects, no other text.`;
```

### AI Response Processing
```typescript
const completion = await openai.chat.completions.create({
  model: "gpt-4",
  messages: [
    {
      role: "system",
      content: "You are a helpful assistant that generates engaging tasks to combat boredom. Always respond with valid JSON arrays only."
    },
    {
      role: "user",
      content: prompt
    }
  ],
  temperature: 0.8,
  max_tokens: 500,
});

const response = completion.choices[0]?.message?.content;
const tasks = JSON.parse(response);
```

---

## 🔄 State Management

### Local State (React Hooks)
The app uses React's built-in state management with hooks:

```typescript
// Task list state
const [tasks, setTasks] = useState<Task[]>([]);

// Form state for new task
const [newTask, setNewTask] = useState({
  title: '', description: '', category: 'personal', priority: 'medium'
});

// AI generator state
const [showAIGenerator, setShowAIGenerator] = useState(false);
const [aiInputs, setAiInputs] = useState({
  mood: 'neutral', energyLevel: 5, availableTime: 30
});

// Loading states
const [isLoading, setIsLoading] = useState(false);
const [isGenerating, setIsGenerating] = useState(false);
```

### State Updates Pattern
```typescript
// Adding a task
setTasks([newTask, ...(tasks || [])]);

// Updating a task
setTasks((tasks || []).map(task => 
  task._id === taskId 
    ? { ...task, completed: true }
    : task
));

// Deleting a task
setTasks((tasks || []).filter(task => task._id !== taskId));
```

---

## ⚠️ Error Handling

### Frontend Error Handling
```typescript
// Safe array operations
{(tasks || []).map((task) => (/* component */))}

// API error handling
try {
  const response = await fetch('/api/tasks');
  const data = await response.json();
  setTasks(Array.isArray(data) ? data : []);
} catch (error) {
  console.error('Failed to fetch tasks:', error);
  setTasks([]);
}
```

### Backend Error Handling
```typescript
export async function GET() {
  try {
    await dbConnect();
    const tasks = await Task.find({}).sort({ createdAt: -1 });
    return NextResponse.json(tasks);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}
```

### AI Error Handling
```typescript
try {
  const completion = await openai.chat.completions.create({/*...*/});
  const response = completion.choices[0]?.message?.content;
  
  if (!response) {
    throw new Error('No response from OpenAI');
  }
  
  const tasks = JSON.parse(response);
  return NextResponse.json(tasks);
} catch (error) {
  console.error('AI task generation error:', error);
  return NextResponse.json(
    { error: 'Failed to generate tasks' },
    { status: 500 }
  );
}
```

---

## 🔧 Environment Configuration

### Environment Variables (`.env.local`)
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/bored?retryWrites=true&w=majority
OPENAI_API_KEY=sk-your-openai-api-key-here
```

### Environment Setup Process
1. **MongoDB Atlas Setup**
   - Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
   - Create new cluster (free tier available)
   - Get connection string from cluster settings
   - Replace `your_mongodb_atlas_connection_string_here` with actual string

2. **OpenAI API Setup**
   - Sign up at [OpenAI Platform](https://platform.openai.com/)
   - Navigate to API Keys section
   - Create new API key
   - Replace `your_openai_api_key_here` with actual key

### Environment Validation
```typescript
const MONGODB_URI = process.env.MONGODB_URI!;
if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}
```

---

## 🚀 Development Workflow

### Initial Setup
```bash
# 1. Install Node.js 20+
brew install node@20
export PATH="/opt/homebrew/opt/node@20/bin:$PATH"

# 2. Create Next.js project
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --yes

# 3. Install dependencies
npm install mongodb mongoose openai lucide-react @types/mongodb

# 4. Set up environment variables
echo "MONGODB_URI=your_mongodb_atlas_connection_string_here" > .env.local
echo "OPENAI_API_KEY=your_openai_api_key_here" >> .env.local

# 5. Start development server
npm run dev
```

### Development Commands
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### File Modification Workflow
1. **Frontend Changes**: Edit `src/app/page.tsx`
2. **API Changes**: Edit files in `src/app/api/`
3. **Database Changes**: Edit `src/models/Task.ts`
4. **Styling Changes**: Modify Tailwind classes or `src/app/globals.css`

---

## 🌐 Deployment Guide

### Vercel Deployment
1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-github-repo>
   git push -u origin main
   ```

2. **Connect to Vercel**
   - Go to [Vercel](https://vercel.com)
   - Import your GitHub repository
   - Add environment variables in Vercel dashboard

3. **Environment Variables in Vercel**
   - Go to Project Settings → Environment Variables
   - Add `MONGODB_URI` and `OPENAI_API_KEY`

### Production Considerations
- **Database**: MongoDB Atlas handles scaling
- **API Limits**: Monitor OpenAI API usage
- **Performance**: Next.js optimizes automatically
- **Security**: Environment variables are encrypted

---

## 🔍 Troubleshooting

### Common Issues

**1. "tasks.map is not a function"**
- **Cause**: API returns non-array data
- **Solution**: Added safety checks `(tasks || []).map()`

**2. "MongoDB connection failed"**
- **Cause**: Invalid connection string or network issues
- **Solution**: Check `.env.local` and MongoDB Atlas settings

**3. "OpenAI API error"**
- **Cause**: Invalid API key or rate limits
- **Solution**: Verify API key and check OpenAI dashboard

**4. "Node.js version error"**
- **Cause**: Using Node.js < 18.18.0
- **Solution**: Upgrade to Node.js 20+ using Homebrew

### Debug Commands
```bash
# Check Node.js version
node --version

# Check if server is running
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000

# Check TypeScript errors
npx tsc --noEmit

# Check environment variables
cat .env.local
```

---

## 📊 Performance Considerations

### Database Optimization
- **Connection Pooling**: MongoDB connection is cached
- **Indexing**: MongoDB automatically indexes `_id`
- **Query Optimization**: Limited to necessary fields

### Frontend Optimization
- **Code Splitting**: Next.js handles automatically
- **Image Optimization**: Not used in this app
- **Bundle Size**: Minimal dependencies

### API Optimization
- **Caching**: No caching implemented (can be added)
- **Rate Limiting**: OpenAI handles API limits
- **Error Handling**: Comprehensive error catching

---

## 🔮 Future Enhancements

### Planned Features
- **User Authentication**: NextAuth.js integration
- **Task Statistics**: Progress tracking and analytics
- **Task Scheduling**: Calendar integration
- **Mobile App**: React Native version
- **Social Features**: Task sharing and collaboration

### Technical Improvements
- **Caching**: Redis for session management
- **Real-time Updates**: WebSocket integration
- **Advanced AI**: More sophisticated prompt engineering
- **Testing**: Jest and React Testing Library
- **CI/CD**: GitHub Actions for automated deployment

---

## 📚 Additional Resources

### Documentation
- [Next.js Documentation](https://nextjs.org/docs)
- [MongoDB Atlas Guide](https://docs.atlas.mongodb.com/)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

### Tools Used
- **VS Code**: Primary development environment
- **Postman**: API testing (optional)
- **MongoDB Compass**: Database visualization (optional)
- **GitHub**: Version control

---

This technical documentation provides a complete understanding of how the Bored app is structured, how components communicate, and how to maintain and extend the application. Every file, function, and configuration is explained in detail for easy reference and future development.
