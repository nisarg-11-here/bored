'use client';

import { useState, useEffect } from 'react';
import { Plus, Sparkles, CheckCircle, Circle, Trash2, Edit3 } from 'lucide-react';

interface Task {
  _id: string;
  title: string;
  description?: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  createdAt: string;
  completedAt?: string;
  aiGenerated: boolean;
}

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState({ title: '', description: '', category: 'personal', priority: 'medium' as 'low' | 'medium' | 'high' });
  const [isLoading, setIsLoading] = useState(false);
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [aiInputs, setAiInputs] = useState({ mood: 'neutral', energyLevel: 5, availableTime: 30 });
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch tasks on component mount
  useEffect(() => {
    fetchTasks();
  }, []);

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

  const createTask = async () => {
    if (!newTask.title.trim()) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTask),
      });
      
      if (response.ok) {
        const task = await response.json();
        setTasks([task, ...(tasks || [])]);
        setNewTask({ title: '', description: '', category: 'personal', priority: 'medium' });
      }
    } catch (error) {
      console.error('Failed to create task:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTask = async (taskId: string, completed: boolean) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          completed, 
          completedAt: completed ? new Date().toISOString() : null 
        }),
      });
      
      if (response.ok) {
        setTasks((tasks || []).map(task => 
          task._id === taskId 
            ? { ...task, completed, completedAt: completed ? new Date().toISOString() : undefined }
            : task
        ));
      }
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setTasks((tasks || []).filter(task => task._id !== taskId));
      }
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const generateAITasks = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/ai/generate-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(aiInputs),
      });
      
      if (response.ok) {
        const aiTasks = await response.json();
        // Add AI-generated tasks to the list
        for (const task of aiTasks) {
          const response = await fetch('/api/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...task, aiGenerated: true }),
          });
          
          if (response.ok) {
            const newTask = await response.json();
            setTasks([newTask, ...(tasks || [])]);
          }
        }
        setShowAIGenerator(false);
        setAiInputs({ mood: 'neutral', energyLevel: 5, availableTime: 30 });
      }
    } catch (error) {
      console.error('Failed to generate AI tasks:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      personal: 'bg-blue-100 text-blue-800',
      work: 'bg-purple-100 text-purple-800',
      health: 'bg-green-100 text-green-800',
      learning: 'bg-orange-100 text-orange-800',
      creative: 'bg-pink-100 text-pink-800',
      social: 'bg-indigo-100 text-indigo-800',
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Bored?</h1>
          <p className="text-gray-600">Let's find something interesting to do!</p>
        </div>

        {/* AI Task Generator */}
        <div className="mb-8">
          <button
            onClick={() => setShowAIGenerator(!showAIGenerator)}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200 shadow-lg"
          >
            <Sparkles className="w-5 h-5" />
            Generate AI Tasks
          </button>

          {showAIGenerator && (
            <div className="mt-4 bg-white rounded-lg p-6 shadow-lg">
              <h3 className="text-lg font-semibold mb-4">How are you feeling?</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mood</label>
                  <select
                    value={aiInputs.mood}
                    onChange={(e) => setAiInputs({...aiInputs, mood: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="happy">Happy</option>
                    <option value="neutral">Neutral</option>
                    <option value="stressed">Stressed</option>
                    <option value="tired">Tired</option>
                    <option value="excited">Excited</option>
                    <option value="bored">Bored</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Energy Level (1-10)</label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={aiInputs.energyLevel}
                    onChange={(e) => setAiInputs({...aiInputs, energyLevel: parseInt(e.target.value)})}
                    className="w-full"
                  />
                  <span className="text-sm text-gray-600">{aiInputs.energyLevel}/10</span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Available Time (minutes)</label>
                  <input
                    type="number"
                    min="5"
                    max="480"
                    value={aiInputs.availableTime}
                    onChange={(e) => setAiInputs({...aiInputs, availableTime: parseInt(e.target.value)})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>
              <button
                onClick={generateAITasks}
                disabled={isGenerating}
                className="bg-purple-500 text-white px-4 py-2 rounded-md hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? 'Generating...' : 'Generate Tasks'}
              </button>
            </div>
          )}
        </div>

        {/* Add New Task */}
        <div className="bg-white rounded-lg p-6 shadow-lg mb-8">
          <h2 className="text-xl font-semibold mb-4">Add New Task</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="Task title"
              value={newTask.title}
              onChange={(e) => setNewTask({...newTask, title: e.target.value})}
              className="md:col-span-2 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <select
              value={newTask.category}
              onChange={(e) => setNewTask({...newTask, category: e.target.value})}
              className="p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="personal">Personal</option>
              <option value="work">Work</option>
              <option value="health">Health</option>
              <option value="learning">Learning</option>
              <option value="creative">Creative</option>
              <option value="social">Social</option>
            </select>
            <select
              value={newTask.priority}
              onChange={(e) => setNewTask({...newTask, priority: e.target.value as 'low' | 'medium' | 'high'})}
              className="p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
            </select>
          </div>
          <textarea
            placeholder="Task description (optional)"
            value={newTask.description}
            onChange={(e) => setNewTask({...newTask, description: e.target.value})}
            className="w-full mt-4 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={2}
          />
          <button
            onClick={createTask}
            disabled={isLoading || !newTask.title.trim()}
            className="mt-4 flex items-center gap-2 bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            {isLoading ? 'Adding...' : 'Add Task'}
          </button>
        </div>

        {/* Task List */}
        <div className="space-y-4">
          {(tasks || []).map((task) => (
            <div
              key={task._id}
              className={`bg-white rounded-lg p-4 shadow-md transition-all duration-200 ${
                task.completed ? 'opacity-75' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <button
                  onClick={() => toggleTask(task._id, !task.completed)}
                  className="mt-1"
                >
                  {task.completed ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <Circle className="w-5 h-5 text-gray-400 hover:text-green-500" />
                  )}
                </button>
                
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className={`font-medium ${task.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                        {task.title}
                        {task.aiGenerated && (
                          <Sparkles className="inline w-4 h-4 ml-2 text-purple-500" />
                        )}
                      </h3>
                      {task.description && (
                        <p className={`text-sm mt-1 ${task.completed ? 'text-gray-400' : 'text-gray-600'}`}>
                          {task.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(task.category)}`}>
                          {task.category}
                        </span>
                        <span className={`text-xs font-medium ${getPriorityColor(task.priority)}`}>
                          {task.priority} priority
                        </span>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => deleteTask(task._id)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {(!tasks || tasks.length === 0) && (
            <div className="text-center py-12">
              <p className="text-gray-500">No tasks yet. Add a task or generate some with AI!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
