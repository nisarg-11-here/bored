'use client';

import { useState, useEffect } from 'react';
import { Plus, Sparkles, CheckCircle, Circle, Trash2, Clock, RefreshCw } from 'lucide-react';

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
        }
      }
    } catch (error) {
      console.error('Failed to create task:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addGeneratedTask = async (generatedTask: GeneratedTask) => {
    await createTask({
      title: generatedTask.title,
      description: generatedTask.description,
      category: generatedTask.category,
      priority: generatedTask.priority,
      aiGenerated: true,
      estimatedTime: generatedTask.estimatedTime
    });
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
        setGeneratedTasks(aiTasks);
      }
    } catch (error) {
      console.error('Failed to generate AI tasks:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const clearGeneratedTasks = () => {
    setGeneratedTasks([]);
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
      personal: 'bg-blue-200 text-blue-900',
      work: 'bg-slate-200 text-slate-900',
      health: 'bg-emerald-200 text-emerald-900',
      learning: 'bg-sky-200 text-sky-900',
      creative: 'bg-indigo-200 text-indigo-900',
      social: 'bg-cyan-200 text-cyan-900',
      focus: 'bg-blue-200 text-blue-900',
      planning: 'bg-slate-200 text-slate-900',
    };
    return colors[category as keyof typeof colors] || 'bg-gray-200 text-gray-900';
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
    const totalTime = tasks.reduce((sum, task) => sum + (task.estimatedTime || 25), 0);
    const hours = Math.floor(totalTime / 60);
    const minutes = totalTime % 60;
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>
      
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
              Bored Task Forge
            </h1>
          </div>
          <p className="text-gray-300 text-lg font-light">Transform your time into meaningful activities</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Your Inputs */}
          <div className="space-y-6">
            <div className="backdrop-blur-xl bg-white/10 rounded-2xl p-8 shadow-2xl border border-white/20">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white">Your inputs</h2>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-200 mb-3">Mood</label>
                  <select
                    value={aiInputs.mood}
                    onChange={(e) => setAiInputs({...aiInputs, mood: e.target.value})}
                    className="w-full p-4 bg-white/10 border-2 border-white/20 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white placeholder-gray-300 backdrop-blur-sm transition-all duration-300"
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
                  <label className="block text-sm font-semibold text-gray-200 mb-3">Time available (mins)</label>
                  <input
                    type="number"
                    min="5"
                    max="480"
                    value={aiInputs.availableTime}
                    onChange={(e) => setAiInputs({...aiInputs, availableTime: parseInt(e.target.value)})}
                    className="w-full p-4 bg-white/10 border-2 border-white/20 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white placeholder-gray-300 backdrop-blur-sm transition-all duration-300"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-200 mb-3">Energy</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={aiInputs.energyLevel}
                      onChange={(e) => setAiInputs({...aiInputs, energyLevel: parseInt(e.target.value)})}
                      className="flex-1 accent-blue-400"
                    />
                    <span className="text-sm font-semibold text-white bg-blue-500/20 px-3 py-1 rounded-full">{aiInputs.energyLevel}%</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-200 mb-3">Schedule notes</label>
                  <textarea
                    placeholder="e.g. Call at 3pm, school run at 5..."
                    value={aiInputs.scheduleNotes}
                    onChange={(e) => setAiInputs({...aiInputs, scheduleNotes: e.target.value})}
                    className="w-full p-4 bg-white/10 border-2 border-white/20 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white placeholder-gray-300 backdrop-blur-sm transition-all duration-300"
                    rows={3}
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={generateAITasks}
                    disabled={isGenerating}
                    className="flex items-center gap-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-4 rounded-xl hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-xl transition-all duration-300 transform hover:scale-105"
                  >
                    <Sparkles className="w-5 h-5" />
                    {isGenerating ? 'Generating...' : 'Generate suggestions'}
                  </button>
                  <button
                    onClick={clearGeneratedTasks}
                    className="px-6 py-4 border-2 border-white/30 text-white rounded-xl hover:bg-white/10 hover:border-white/50 font-semibold transition-all duration-300 backdrop-blur-sm"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>

            {/* Generated Tasks Grid */}
            {generatedTasks.length > 0 && (
              <div className="backdrop-blur-xl bg-white/10 rounded-2xl p-8 shadow-2xl border border-white/20">
                <h3 className="text-xl font-bold text-white mb-6">Suggested Tasks</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {generatedTasks.map((task, index) => (
                    <div key={index} className="backdrop-blur-sm bg-white/5 rounded-xl p-6 border border-white/10 hover:border-blue-400/50 transition-all duration-300 hover:transform hover:scale-105">
                      <h4 className="font-bold text-white mb-3 text-lg">{task.title}</h4>
                      <p className="text-gray-300 mb-4 leading-relaxed">{task.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${getCategoryColor(task.category)}`}>
                            {getCategoryDisplayName(task.category)}
                          </span>
                          <span className="text-xs text-gray-300 flex items-center gap-1 font-medium bg-white/10 px-2 py-1 rounded-full">
                            <Clock className="w-3 h-3" />
                            {task.estimatedTime || 25}m
                          </span>
                        </div>
                        <button
                          onClick={() => addGeneratedTask(task)}
                          className="text-blue-300 hover:text-blue-200 text-sm font-bold hover:underline transition-colors"
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

          {/* Right Column - Your To-Do List */}
          <div className="space-y-6">
            {/* Add Your Own Task - Fixed at Top */}
            <div className="backdrop-blur-xl bg-white/10 rounded-2xl p-8 shadow-2xl border border-white/20">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                    <Plus className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Add your own task</h3>
                </div>
                <button
                  onClick={fetchTasks}
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  type="text"
                  placeholder="Task title"
                  value={newTask.title}
                  onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                  className="p-4 bg-white/10 border-2 border-white/20 rounded-xl focus:ring-2 focus:ring-green-400 focus:border-green-400 text-white placeholder-gray-300 backdrop-blur-sm transition-all duration-300"
                />
                <input
                  type="number"
                  placeholder="25"
                  value={newTask.estimatedTime}
                  onChange={(e) => setNewTask({...newTask, estimatedTime: parseInt(e.target.value) || 25})}
                  className="p-4 bg-white/10 border-2 border-white/20 rounded-xl focus:ring-2 focus:ring-green-400 focus:border-green-400 text-white placeholder-gray-300 backdrop-blur-sm transition-all duration-300"
                />
                <select
                  value={newTask.category}
                  onChange={(e) => setNewTask({...newTask, category: e.target.value})}
                  className="p-4 bg-white/10 border-2 border-white/20 rounded-xl focus:ring-2 focus:ring-green-400 focus:border-green-400 text-white placeholder-gray-300 backdrop-blur-sm transition-all duration-300"
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
                className="mt-4 w-full p-4 bg-white/10 border-2 border-white/20 rounded-xl focus:ring-2 focus:ring-green-400 focus:border-green-400 text-white placeholder-gray-300 backdrop-blur-sm transition-all duration-300"
              />
              <button
                onClick={() => createTask()}
                disabled={isLoading || !newTask.title.trim()}
                className="mt-4 flex items-center gap-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-4 rounded-xl hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <Plus className="w-5 h-5" />
                Add Task
              </button>
            </div>

            {/* Task List - Scrollable Area */}
            <div className="backdrop-blur-xl bg-white/10 rounded-2xl p-8 shadow-2xl border border-white/20">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">Your to-do list</h2>
                </div>
                <div className="bg-white/10 px-4 py-2 rounded-full">
                  <p className="text-sm font-bold text-white">
                    Remaining time: {calculateRemainingTime()}
                  </p>
                </div>
              </div>

              {/* Current Tasks */}
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {(tasks || []).map((task) => (
                  <div
                    key={task._id}
                    className={`flex items-center gap-4 p-6 rounded-xl border-2 backdrop-blur-sm transition-all duration-300 ${
                      task.completed 
                        ? 'bg-white/5 border-white/10 opacity-60' 
                        : 'bg-white/10 border-white/20 hover:border-blue-400/50 hover:transform hover:scale-105'
                    }`}
                  >
                    <button
                      onClick={() => toggleTask(task._id, !task.completed)}
                      className="flex-shrink-0"
                    >
                      {task.completed ? (
                        <CheckCircle className="w-6 h-6 text-green-400" />
                      ) : (
                        <Circle className="w-6 h-6 text-gray-300 hover:text-green-400 transition-colors" />
                      )}
                    </button>
                    
                    <div className="flex-1">
                      <h3 className={`font-bold text-lg ${task.completed ? 'line-through text-gray-400' : 'text-white'}`}>
                        {task.title}
                        {task.aiGenerated && (
                          <Sparkles className="inline w-5 h-5 ml-2 text-blue-400" />
                        )}
                      </h3>
                      {task.description && (
                        <p className={`text-sm mt-2 ${task.completed ? 'text-gray-400' : 'text-gray-300'}`}>
                          {task.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${getCategoryColor(task.category)}`}>
                          {getCategoryDisplayName(task.category)}
                        </span>
                        <span className="text-xs text-gray-300 flex items-center gap-1 font-medium bg-white/10 px-3 py-1 rounded-full">
                          <Clock className="w-3 h-3" />
                          {task.estimatedTime || 25}m
                        </span>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => deleteTask(task._id)}
                      className="text-red-400 hover:text-red-300 text-sm font-bold hover:underline transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                
                {(!tasks || tasks.length === 0) && (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Clock className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-400 font-medium text-lg">No tasks yet. Add a task or generate some with AI!</p>
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
