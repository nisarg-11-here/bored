'use client';

import { useState, useEffect } from 'react';
import { Plus, Sparkles, CheckCircle, Circle, Clock, RefreshCw } from 'lucide-react';

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
  estimatedTime?: number;
}

interface GeneratedTask {
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  estimatedTime?: number;
}

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState({ title: '', description: '', category: 'personal', priority: 'medium' as 'low' | 'medium' | 'high', estimatedTime: 25 });
  const [isLoading, setIsLoading] = useState(false);
  const [generatedTasks, setGeneratedTasks] = useState<GeneratedTask[]>([]);
  const [aiInputs, setAiInputs] = useState({ 
    mood: 'focused', 
    energyLevel: 7, 
    availableTime: 45,
    scheduleNotes: ''
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Fetch tasks on component mount
  useEffect(() => {
    fetchTasks();
  }, []);

  // Auto-remove toasts after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setToasts(prev => prev.slice(1));
    }, 5000);
    return () => clearTimeout(timer);
  }, [toasts]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/tasks');
      const data = await response.json();
      setTasks(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
      setTasks([]);
      showToast('Failed to load tasks', 'error');
    }
  };

  const createTask = async (taskData?: Partial<Task>) => {
    const taskToCreate = taskData || newTask;
    if (!taskToCreate.title?.trim()) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskToCreate),
      });
      
      if (response.ok) {
        const task = await response.json();
        setTasks([task, ...(tasks || [])]);
        if (!taskData) {
          setNewTask({ title: '', description: '', category: 'personal', priority: 'medium', estimatedTime: 25 });
          showToast('Task added successfully!');
        }
      } else {
        showToast('Failed to add task', 'error');
      }
    } catch (error) {
      console.error('Failed to create task:', error);
      showToast('Failed to add task', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const addGeneratedTask = async (generatedTask: GeneratedTask) => {
    try {
      await createTask({
        title: generatedTask.title,
        description: generatedTask.description,
        category: generatedTask.category,
        priority: generatedTask.priority,
        aiGenerated: true,
        estimatedTime: generatedTask.estimatedTime
      });
      
      // Remove the task from generated tasks list
      setGeneratedTasks(prev => prev.filter(task => 
        task.title !== generatedTask.title || 
        task.description !== generatedTask.description
      ));
      
      showToast(`"${generatedTask.title}" added to your tasks!`);
    } catch (error) {
      showToast('Failed to add AI task', 'error');
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
        const updatedTask = await response.json();
        setTasks((tasks || []).map(task => 
          task._id === taskId ? updatedTask : task
        ));
        
        const task = tasks.find(t => t._id === taskId);
        if (task) {
          showToast(
            completed 
              ? `"${task.title}" marked as complete!` 
              : `"${task.title}" marked as incomplete!`
          );
        }
      } else {
        showToast('Failed to update task', 'error');
      }
    } catch (error) {
      console.error('Failed to toggle task:', error);
      showToast('Failed to update task', 'error');
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        const task = tasks.find(t => t._id === taskId);
        setTasks((tasks || []).filter(task => task._id !== taskId));
        
        if (task) {
          showToast(`"${task.title}" deleted successfully!`);
        }
      } else {
        showToast('Failed to delete task', 'error');
      }
    } catch (error) {
      console.error('Failed to delete task:', error);
      showToast('Failed to delete task', 'error');
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
        const generatedTasksData = await response.json();
        setGeneratedTasks(generatedTasksData);
        showToast(`Generated ${generatedTasksData.length} new task suggestions!`, 'info');
      } else {
        const errorData = await response.json();
        const errorMessage = errorData.error || 'Failed to generate tasks';
        showToast(errorMessage, 'error');
      }
    } catch (error) {
      console.error('Failed to generate AI tasks:', error);
      showToast('Failed to generate tasks', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const clearGeneratedTasks = () => {
    setGeneratedTasks([]);
    showToast('Generated tasks cleared!', 'info');
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      personal: 'bg-blue-100 text-blue-800',
      work: 'bg-purple-100 text-purple-800',
      health: 'bg-green-100 text-green-800',
      learning: 'bg-orange-100 text-orange-800',
      creative: 'bg-pink-100 text-pink-800',
      social: 'bg-indigo-100 text-indigo-800',
      focus: 'bg-purple-100 text-purple-800',
      planning: 'bg-blue-100 text-blue-800',
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getCategoryDisplayName = (category: string) => {
    const displayNames = {
      personal: 'Personal',
      work: 'Work',
      health: 'Health',
      learning: 'Learning',
      creative: 'Creative',
      social: 'Social',
      focus: 'Focus',
      planning: 'Planning',
    };
    return displayNames[category as keyof typeof displayNames] || category;
  };

  const calculateRemainingTime = () => {
    const totalTime = tasks.reduce((sum, task) => {
      // Only count incomplete tasks
      if (!task.completed) {
        return sum + (task.estimatedTime || 25);
      }
      return sum;
    }, 0);
    const hours = Math.floor(totalTime / 60);
    const minutes = totalTime % 60;
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`px-4 py-3 rounded-lg shadow-lg text-white font-medium transform transition-all duration-300 ${
              toast.type === 'success' 
                ? 'bg-green-500' 
                : toast.type === 'error' 
                ? 'bg-red-500' 
                : 'bg-blue-500'
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Bored Task Forge</h1>
          <p className="text-gray-700 font-medium">Transform your time into meaningful activities</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Your Inputs */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6 shadow-lg border border-gray-200">
              <div className="flex items-center gap-2 mb-6">
                <Sparkles className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">Your inputs</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Mood</label>
                  <select
                    value={aiInputs.mood}
                    onChange={(e) => setAiInputs({...aiInputs, mood: e.target.value})}
                    className="w-full p-3 border-2 border-gray-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-blue-600 placeholder-gray-500"
                  >
                    <option value="focused">Focused</option>
                    <option value="happy">Happy</option>
                    <option value="neutral">Neutral</option>
                    <option value="stressed">Stressed</option>
                    <option value="tired">Tired</option>
                    <option value="excited">Excited</option>
                    <option value="bored">Bored</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Time available (mins)</label>
                  <input
                    type="number"
                    min="5"
                    max="480"
                    value={aiInputs.availableTime}
                    onChange={(e) => setAiInputs({...aiInputs, availableTime: parseInt(e.target.value)})}
                    className="w-full p-3 border-2 border-gray-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-blue-600 placeholder-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Energy</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={aiInputs.energyLevel}
                      onChange={(e) => setAiInputs({...aiInputs, energyLevel: parseInt(e.target.value)})}
                      className="flex-1 accent-blue-600"
                    />
                    <span className="text-sm font-semibold text-gray-800">{aiInputs.energyLevel}%</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Schedule notes</label>
                  <textarea
                    placeholder="e.g. Call at 3pm, school run at 5..."
                    value={aiInputs.scheduleNotes}
                    onChange={(e) => setAiInputs({...aiInputs, scheduleNotes: e.target.value})}
                    className="w-full p-3 border-2 border-gray-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-blue-600 placeholder-gray-500"
                    rows={3}
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={generateAITasks}
                    disabled={isGenerating}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg"
                  >
                    <Sparkles className="w-4 h-4" />
                    {isGenerating ? 'Generating...' : 'Generate suggestions'}
                  </button>
                  <button
                    onClick={clearGeneratedTasks}
                    className="px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 hover:border-gray-400 font-semibold"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>

            {/* Generated Tasks Grid */}
            {generatedTasks.length > 0 && (
              <div className="bg-white rounded-lg p-6 shadow-lg border border-gray-200">
                <h3 className="text-lg font-semibold mb-4 text-gray-900">Suggested Tasks</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {generatedTasks.map((task, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200 hover:border-blue-300 transition-colors">
                      <h4 className="font-semibold text-gray-900 mb-2">{task.title}</h4>
                      <p className="text-sm text-gray-700 mb-3">{task.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getCategoryColor(task.category)}`}>
                            {getCategoryDisplayName(task.category)}
                          </span>
                          <span className="text-xs text-gray-600 flex items-center gap-1 font-medium">
                            <Clock className="w-3 h-3" />
                            {task.estimatedTime || 25}m
                          </span>
                        </div>
                        <button
                          onClick={() => addGeneratedTask(task)}
                          className="text-blue-600 hover:text-blue-700 text-sm font-semibold hover:underline"
                        >
                          + Add
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Task Management */}
          <div className="space-y-6">
            {/* Add Your Own Task - Fixed at Top */}
            <div className="bg-white rounded-lg p-6 shadow-lg border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Add your own task</h3>
                <button
                  onClick={fetchTasks}
                  className="text-gray-600 hover:text-gray-800"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Task title"
                  value={newTask.title}
                  onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                  className="p-2 border-2 border-gray-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-blue-600 placeholder-gray-500"
                />
                <input
                  type="number"
                  placeholder="25"
                  value={newTask.estimatedTime}
                  onChange={(e) => setNewTask({...newTask, estimatedTime: parseInt(e.target.value) || 25})}
                  className="p-2 border-2 border-gray-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-blue-600 placeholder-gray-500"
                />
                <select
                  value={newTask.category}
                  onChange={(e) => setNewTask({...newTask, category: e.target.value})}
                  className="p-2 border-2 border-gray-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-blue-600 placeholder-gray-500"
                >
                  <option value="focus">Focus</option>
                  <option value="planning">Planning</option>
                  <option value="health">Health</option>
                  <option value="personal">Personal</option>
                  <option value="work">Work</option>
                  <option value="creative">Creative</option>
                  <option value="social">Social</option>
                </select>
              </div>
              <input
                type="text"
                placeholder="Task description (optional)"
                value={newTask.description}
                onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                className="mt-3 w-full p-2 border-2 border-gray-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-blue-600 placeholder-gray-500"
              />
              <button
                onClick={() => createTask()}
                disabled={isLoading || !newTask.title.trim()}
                className="mt-3 flex items-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg"
              >
                <Plus className="w-4 h-4" />
                Add Task
              </button>
            </div>

            {/* Task List - Scrollable Area */}
            <div className="bg-white rounded-lg p-6 shadow-lg border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-gray-600" />
                  <h2 className="text-xl font-semibold text-gray-900">Your to-do list</h2>
                </div>
                <p className="text-sm font-semibold text-gray-700">
                  Remaining time: {calculateRemainingTime()}
                </p>
              </div>

              {/* Current Tasks */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {(tasks || []).map((task) => (
                  <div
                    key={task._id}
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 ${
                      task.completed ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-200 hover:border-blue-300'
                    } transition-colors`}
                  >
                    <button
                      onClick={() => toggleTask(task._id, !task.completed)}
                      className="flex-shrink-0"
                    >
                      {task.completed ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <Circle className="w-5 h-5 text-gray-400 hover:text-green-600" />
                      )}
                    </button>
                    
                    <div className="flex-1">
                      <h3 className={`font-semibold ${task.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                        {task.title}
                        {task.aiGenerated && (
                          <Sparkles className="inline w-4 h-4 ml-2 text-blue-600" />
                        )}
                      </h3>
                      {task.description && (
                        <p className={`text-sm mt-1 ${task.completed ? 'text-gray-400' : 'text-gray-600'}`}>
                          {task.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getCategoryColor(task.category)}`}>
                          {getCategoryDisplayName(task.category)}
                        </span>
                        <span className="text-xs text-gray-600 flex items-center gap-1 font-medium">
                          <Clock className="w-3 h-3" />
                          {task.estimatedTime || 25}m
                        </span>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => deleteTask(task._id)}
                      className="text-red-600 hover:text-red-700 text-sm font-semibold hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                
                {(!tasks || tasks.length === 0) && (
                  <div className="text-center py-8">
                    <p className="text-gray-600 font-medium">No tasks yet. Add a task or generate some with AI!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
