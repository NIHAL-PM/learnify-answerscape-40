import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';
import { 
  Loader2Icon, 
  DatabaseIcon, 
  UserIcon, 
  BarChart2Icon, 
  ArrowLeftIcon,
  KeyIcon,
  ShieldIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  SearchIcon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { getGeminiApiKey } from '@/lib/env';
import { getSystemStats } from '@/services/api';
import { useQuestionStore } from '@/services/questionStore';
import { Question, QuestionDifficulty } from '@/types';
import { toQuestionDifficulty } from '@/utils/typeUtils';

const AdminPanel = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [aiModel, setAiModel] = useState('gemini-1.5-flash');
  const [systemStats, setSystemStats] = useState({
    totalUsers: 0,
    premiumUsers: 0,
    activeToday: 0,
    totalQuestionsAnswered: 0,
    totalQuestionsCorrect: 0,
    examTypeDistribution: {} as Record<string, number>
  });
  
  const { customQuestions, updateQuestion, deleteQuestion, addCustomQuestion } = useQuestionStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [newQuestion, setNewQuestion] = useState<Partial<Question>>({
    text: '',
    options: ['', '', '', ''],
    correctOption: 0,
    explanation: '',
    category: '',
    difficulty: 'medium'
  });
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  
  useEffect(() => {
    const storedApiKey = localStorage.getItem('GEMINI_API_KEY');
    const envApiKey = getGeminiApiKey();
    
    if (storedApiKey) {
      setGeminiApiKey(storedApiKey);
    } else if (envApiKey) {
      setGeminiApiKey(envApiKey);
    }
    
    if (isLoggedIn) {
      const stats = getSystemStats();
      setSystemStats(stats);
    }
  }, [isLoggedIn]);
  
  const filteredQuestions = customQuestions.filter(question => 
    question.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
    question.category.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleLogin = () => {
    setIsLoading(true);
    
    setTimeout(() => {
      if (username === 'bluewaterbottle' && password === 'waterbottle') {
        setIsLoggedIn(true);
        
        const stats = getSystemStats();
        setSystemStats(stats);
        
        toast({
          title: 'Login successful',
          description: 'Welcome to the admin panel',
        });
      } else {
        toast({
          title: 'Login failed',
          description: 'Invalid username or password',
          variant: 'destructive'
        });
      }
      setIsLoading(false);
    }, 1500);
  };
  
  const handleUpdateApiKey = () => {
    setIsLoading(true);
    
    localStorage.setItem('GEMINI_API_KEY', geminiApiKey);
    
    setTimeout(() => {
      toast({
        title: 'API key updated',
        description: 'Gemini API key has been updated successfully',
      });
      setIsLoading(false);
    }, 1000);
  };
  
  const handleUpdateModel = (value: string) => {
    setAiModel(value);
    
    toast({
      title: 'AI model updated',
      description: `AI model has been set to ${value}`,
    });
  };
  
  const handleEditQuestion = (question: Question) => {
    setEditingQuestion(question);
    setShowEditDialog(true);
  };
  
  const handleDeleteQuestion = (id: string) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      deleteQuestion(id);
      toast({
        title: 'Question deleted',
        description: 'The question has been successfully deleted',
      });
    }
  };
  
  const handleSaveEdit = () => {
    if (!editingQuestion) return;
    
    updateQuestion(editingQuestion.id, editingQuestion);
    setShowEditDialog(false);
    
    toast({
      title: 'Question updated',
      description: 'The question has been successfully updated',
    });
  };
  
  const handleCreateQuestion = () => {
    if (!newQuestion.text || newQuestion.options?.some(option => !option)) {
      toast({
        title: 'Missing information',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }
    
    addCustomQuestion({
      text: newQuestion.text || '',
      options: newQuestion.options as string[],
      correctOption: newQuestion.correctOption || 0,
      explanation: newQuestion.explanation || '',
      category: newQuestion.category || 'General',
      difficulty: toQuestionDifficulty(newQuestion.difficulty as string || 'medium')
    });
    
    setNewQuestion({
      text: '',
      options: ['', '', '', ''],
      correctOption: 0,
      explanation: '',
      category: '',
      difficulty: 'medium'
    });
    
    setShowAddDialog(false);
    
    toast({
      title: 'Question added',
      description: 'New question has been successfully added to the database',
    });
  };
  
  const handleLogout = () => {
    setIsLoggedIn(false);
    setUsername('');
    setPassword('');
    toast({
      title: 'Logged out',
      description: 'You have been successfully logged out',
    });
  };
  
  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background to-muted/40 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full"
        >
          <Card className="overflow-hidden border-2 border-primary/10 shadow-lg bg-card/95 backdrop-blur-sm rounded-xl">
            <CardHeader className="pb-2 space-y-1">
              <div className="mx-auto mb-2 flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-md">
                <ShieldIcon className="text-white h-8 w-8" />
              </div>
              <CardTitle className="text-xl text-center">Admin Login</CardTitle>
              <CardDescription className="text-center">
                Please enter your credentials to access the admin panel
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input 
                  id="username" 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)} 
                  placeholder="Enter username"
                  className="border-input/60 focus:border-primary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="Enter password"
                  className="border-input/60 focus:border-primary"
                />
              </div>
              <Button 
                onClick={handleLogin} 
                className="w-full bg-gradient-to-r from-primary/90 to-primary shadow-md"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  <>Login</>
                )}
              </Button>
              <Button 
                variant="ghost" 
                className="w-full mt-2" 
                onClick={() => navigate('/')}
              >
                <ArrowLeftIcon className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }
  
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };
  
  const calculatePercentage = (part: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((part / total) * 100);
  };
  
  const formatExamTypeDistribution = () => {
    const total = Object.values(systemStats.examTypeDistribution).reduce((a: number, b: number) => a + b, 0) as number;
    
    return Object.entries(systemStats.examTypeDistribution).map(([examType, count]) => ({
      examType,
      count,
      percentage: calculatePercentage(count as number, total)
    }));
  };
  
  const examTypeData = formatExamTypeDistribution();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/40 p-4">
      <div className="container mx-auto max-w-6xl">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <div className="flex items-center gap-2">
            <ShieldIcon className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Admin Panel
            </h1>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate('/')}
            >
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleLogout}
            >
              Logout
            </Button>
          </div>
        </div>
        
        <Tabs defaultValue="apiSettings" className="w-full">
          <TabsList className="grid grid-cols-4 mb-6">
            <TabsTrigger value="apiSettings" className="flex items-center gap-2">
              <KeyIcon className="h-4 w-4" />
              API Settings
            </TabsTrigger>
            <TabsTrigger value="userStats" className="flex items-center gap-2">
              <UserIcon className="h-4 w-4" />
              User Statistics
            </TabsTrigger>
            <TabsTrigger value="systemStats" className="flex items-center gap-2">
              <BarChart2Icon className="h-4 w-4" />
              System Statistics
            </TabsTrigger>
            <TabsTrigger value="questionManagement" className="flex items-center gap-2">
              <DatabaseIcon className="h-4 w-4" />
              Question Database
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="apiSettings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Gemini API Configuration</CardTitle>
                <CardDescription>
                  Update the API key and model settings for the Gemini API
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="apiKey">Gemini API Key</Label>
                  <div className="flex gap-2">
                    <Input 
                      id="apiKey" 
                      value={geminiApiKey} 
                      onChange={(e) => setGeminiApiKey(e.target.value)} 
                      placeholder="Enter your Gemini API key"
                      className="flex-1 font-mono"
                      type="password"
                    />
                    <Button 
                      onClick={handleUpdateApiKey}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2Icon className="h-4 w-4 animate-spin" />
                      ) : (
                        'Update'
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Get your API key from <a href="https://ai.google.dev/" target="_blank" rel="noopener noreferrer" className="underline">Google AI Studio</a>
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="model">AI Model</Label>
                  <Select 
                    defaultValue={aiModel} 
                    onValueChange={handleUpdateModel}
                  >
                    <SelectTrigger id="model">
                      <SelectValue placeholder="Select model" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gemini-1.5-flash">Gemini 1.5 Flash</SelectItem>
                      <SelectItem value="gemini-1.5-pro">Gemini 1.5 Pro</SelectItem>
                      <SelectItem value="gemini-1.0-pro">Gemini 1.0 Pro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>API Usage</CardTitle>
                <CardDescription>
                  Monitor your Gemini API usage
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="border rounded-lg p-4 bg-card">
                    <p className="text-sm text-muted-foreground">API Calls Today</p>
                    <p className="text-2xl font-bold mt-1">{formatNumber(systemStats.totalQuestionsAnswered)}</p>
                  </div>
                  <div className="border rounded-lg p-4 bg-card">
                    <p className="text-sm text-muted-foreground">Correct Answers</p>
                    <p className="text-2xl font-bold mt-1">{formatNumber(systemStats.totalQuestionsCorrect)}</p>
                  </div>
                  <div className="border rounded-lg p-4 bg-card">
                    <p className="text-sm text-muted-foreground">Accuracy Rate</p>
                    <p className="text-2xl font-bold mt-1">
                      {calculatePercentage(systemStats.totalQuestionsCorrect, systemStats.totalQuestionsAnswered)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="userStats" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>User Statistics</CardTitle>
                <CardDescription>
                  Overview of user activity and engagement
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="border rounded-lg p-4 bg-card">
                    <p className="text-sm text-muted-foreground">Total Users</p>
                    <p className="text-2xl font-bold mt-1">{formatNumber(systemStats.totalUsers)}</p>
                  </div>
                  <div className="border rounded-lg p-4 bg-card">
                    <p className="text-sm text-muted-foreground">Premium Users</p>
                    <p className="text-2xl font-bold mt-1">{formatNumber(systemStats.premiumUsers)}</p>
                  </div>
                  <div className="border rounded-lg p-4 bg-card">
                    <p className="text-sm text-muted-foreground">Active Today</p>
                    <p className="text-2xl font-bold mt-1">{formatNumber(systemStats.activeToday)}</p>
                  </div>
                  <div className="border rounded-lg p-4 bg-card">
                    <p className="text-sm text-muted-foreground">Questions Answered</p>
                    <p className="text-2xl font-bold mt-1">{formatNumber(systemStats.totalQuestionsAnswered)}</p>
                  </div>
                </div>
                
                <div className="rounded-lg border bg-card p-4">
                  <h3 className="font-medium mb-2">User Distribution by Exam Type</h3>
                  <div className="space-y-3">
                    {examTypeData.map(({ examType, count, percentage }) => (
                      <div key={examType} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>{examType}</span>
                          <span>{count} users ({percentage}%)</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary rounded-full h-2" 
                            style={{ width: `${percentage}%` }} 
                          />
                        </div>
                      </div>
                    ))}
                    
                    {examTypeData.length === 0 && (
                      <p className="text-sm text-muted-foreground">No user data available</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="systemStats" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>System Statistics</CardTitle>
                <CardDescription>
                  Overview of system performance and metrics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="border rounded-lg p-4 bg-card">
                    <p className="text-sm text-muted-foreground">Server Uptime</p>
                    <p className="text-2xl font-bold mt-1">99.9%</p>
                  </div>
                  <div className="border rounded-lg p-4 bg-card">
                    <p className="text-sm text-muted-foreground">Avg. Response Time</p>
                    <p className="text-2xl font-bold mt-1">{Math.floor(Math.random() * 400) + 200}ms</p>
                  </div>
                  <div className="border rounded-lg p-4 bg-card">
                    <p className="text-sm text-muted-foreground">Total Questions</p>
                    <p className="text-2xl font-bold mt-1">{formatNumber(systemStats.totalQuestionsAnswered)}</p>
                  </div>
                </div>
                
                <div className="rounded-lg border bg-card p-4">
                  <h3 className="font-medium mb-2">Database Statistics</h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <DatabaseIcon className="h-5 w-5 text-primary" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Storage Usage</p>
                        <p className="text-xs text-muted-foreground">{(systemStats.totalUsers * 2 + systemStats.totalQuestionsAnswered * 0.5).toFixed(1)} KB</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <DatabaseIcon className="h-5 w-5 text-primary" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Total Records</p>
                        <p className="text-xs text-muted-foreground">{formatNumber(systemStats.totalUsers + systemStats.totalQuestionsAnswered)} records</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <DatabaseIcon className="h-5 w-5 text-primary" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Last Activity</p>
                        <p className="text-xs text-muted-foreground">{new Date().toLocaleTimeString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="questionManagement" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Question Database</CardTitle>
                  <CardDescription>
                    View, edit, and manage all questions
                  </CardDescription>
                </div>
                <Button onClick={() => setShowAddDialog(true)} className="flex items-center gap-2">
                  <PlusIcon className="h-4 w-4" />
                  Add Question
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2 mb-4">
                  <div className="relative flex-1">
                    <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search questions..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select defaultValue="all">
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Difficulties</SelectItem>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[400px]">Question</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Difficulty</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredQuestions.length > 0 ? (
                        filteredQuestions.map((question) => (
                          <TableRow key={question.id}>
                            <TableCell className="font-medium">
                              {question.text.length > 80 
                                ? `${question.text.substring(0, 80)}...` 
                                : question.text}
                            </TableCell>
                            <TableCell>{question.category}</TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                question.difficulty === 'easy' 
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                                  : question.difficulty === 'medium'
                                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              }`}>
                                {question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => handleEditQuestion(question)}
                                >
                                  <PencilIcon className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="destructive" 
                                  size="sm" 
                                  onClick={() => handleDeleteQuestion(question.id)}
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="h-24 text-center">
                            No questions found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Question</DialogTitle>
            <DialogDescription>
              Create a new question to add to the database
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="questionText">Question Text</Label>
              <Textarea 
                id="questionText" 
                placeholder="Enter the question text"
                value={newQuestion.text || ''}
                onChange={(e) => setNewQuestion({...newQuestion, text: e.target.value})}
                className="min-h-[100px]"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Options</Label>
              {(newQuestion.options || []).map((option, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <div className="w-8 h-8 flex items-center justify-center bg-primary/10 rounded-full">
                    {String.fromCharCode(65 + index)}
                  </div>
                  <Input 
                    placeholder={`Option ${String.fromCharCode(65 + index)}`}
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...(newQuestion.options || [])];
                      newOptions[index] = e.target.value;
                      setNewQuestion({...newQuestion, options: newOptions});
                    }}
                    className="flex-1"
                  />
                </div>
              ))}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="correctOption">Correct Option</Label>
              <Select 
                value={String(newQuestion.correctOption || 0)}
                onValueChange={(value) => setNewQuestion({...newQuestion, correctOption: Number(value)})}
              >
                <SelectTrigger id="correctOption">
                  <SelectValue placeholder="Select correct option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Option A</SelectItem>
                  <SelectItem value="1">Option B</SelectItem>
                  <SelectItem value="2">Option C</SelectItem>
                  <SelectItem value="3">Option D</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="explanation">Explanation</Label>
              <Textarea 
                id="explanation" 
                placeholder="Explain why the correct answer is right"
                value={newQuestion.explanation || ''}
                onChange={(e) => setNewQuestion({...newQuestion, explanation: e.target.value})}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input 
                  id="category" 
                  placeholder="e.g., History, Science"
                  value={newQuestion.category || ''}
                  onChange={(e) => setNewQuestion({...newQuestion, category: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="difficulty">Difficulty</Label>
                <Select 
                  value={newQuestion.difficulty || 'medium'}
                  onValueChange={(value) => setNewQuestion({...newQuestion, difficulty: value})}
                >
                  <SelectTrigger id="difficulty">
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateQuestion}>
              Add Question
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Question</DialogTitle>
            <DialogDescription>
              Make changes to the selected question
            </DialogDescription>
          </DialogHeader>
          
          {editingQuestion && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="editQuestionText">Question Text</Label>
                <Textarea 
                  id="editQuestionText" 
                  value={editingQuestion.text}
                  onChange={(e) => setEditingQuestion({...editingQuestion, text: e.target.value})}
                  className="min-h-[100px]"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Options</Label>
                {editingQuestion.options.map((option, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <div className="w-8 h-8 flex items-center justify-center bg-primary/10 rounded-full">
                      {String.fromCharCode(65 + index)}
                    </div>
                    <Input 
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...editingQuestion.options];
                        newOptions[index] = e.target.value;
                        setEditingQuestion({...editingQuestion, options: newOptions});
                      }}
                      className="flex-1"
                    />
                  </div>
                ))}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="editCorrectOption">Correct Option</Label>
                <Select 
                  value={String(editingQuestion.correctOption)}
                  onValueChange={(value) => setEditingQuestion({...editingQuestion, correctOption: Number(value)})}
                >
                  <SelectTrigger id="editCorrectOption">
                    <SelectValue placeholder="Select correct option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Option A</SelectItem>
                    <SelectItem value="1">Option B</SelectItem>
                    <SelectItem value="2">Option C</SelectItem>
                    <SelectItem value="3">Option D</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="editExplanation">Explanation</Label>
                <Textarea 
                  id="editExplanation" 
                  value={editingQuestion.explanation}
                  onChange={(e) => setEditingQuestion({...editingQuestion, explanation: e.target.value})}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editCategory">Category</Label>
                  <Input 
                    id="editCategory" 
                    value={editingQuestion.category}
                    onChange={(e) => setEditingQuestion({...editingQuestion, category: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="editDifficulty">Difficulty</Label>
                  <Select 
                    value={editingQuestion.difficulty}
                    onValueChange={(value: any) => setEditingQuestion({...editingQuestion, difficulty: value})}
                  >
                    <SelectTrigger id="editDifficulty">
                      <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPanel;
