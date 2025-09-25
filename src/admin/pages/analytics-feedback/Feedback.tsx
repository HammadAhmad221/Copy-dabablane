import { useState } from "react";
import { Card } from "@/admin/components/ui/card";
import { Input } from "@/admin/components/ui/input";
import { Button } from "@/admin/components/ui/button";
import { Textarea } from "@/admin/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/admin/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/admin/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/admin/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/admin/components/ui/select";
import { Badge } from "@/admin/components/ui/badge";
import { format } from "date-fns";
import { 
  EyeIcon, 
  TrashIcon, 
  PlusIcon, 
  DownloadIcon,
  TagIcon,
  SmileIcon,
  MehIcon,
  FrownIcon
} from "lucide-react";

interface User {
  id: number;
  name: string;
}

interface Feedback {
  id: number;
  userId: number | null;
  userName: string | null;
  feedback: string;
  category: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  createdAt: Date;
}

// Mock users
const mockUsers: User[] = [
  { id: 1, name: "John Doe" },
  { id: 2, name: "Jane Smith" },
];

// Mock categories
const categories = [
  "Bug Report",
  "Feature Request",
  "Complaint",
  "Suggestion",
  "Praise"
];

// Mock data
const mockFeedback: Feedback[] = [
  {
    id: 1,
    userId: 1,
    userName: "John Doe",
    feedback: "The new interface is much easier to use!",
    category: "Praise",
    sentiment: "positive",
    createdAt: new Date(),
  },
  // Add more mock data
];

type FormData = {
  userId: string;
  feedback: string;
  category: string;
};

const Feedback = () => {
  const [feedbackEntries, setFeedbackEntries] = useState<Feedback[]>(mockFeedback);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const itemsPerPage = 5;

  const [formData, setFormData] = useState<FormData>({
    userId: "",
    feedback: "",
    category: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!formData.feedback.trim()) {
      setErrors(prev => ({ ...prev, feedback: "Feedback is required" }));
      return;
    }

    if (formData.feedback.length > 1000) {
      setErrors(prev => ({ ...prev, feedback: "Feedback must not exceed 1000 characters" }));
      return;
    }

    if (!formData.category) {
      setErrors(prev => ({ ...prev, category: "Category is required" }));
      return;
    }

    // Simple sentiment analysis based on keywords
    const sentiment = analyzeSentiment(formData.feedback);

    const newFeedback: Feedback = {
      id: Math.max(...feedbackEntries.map(f => f.id)) + 1,
      userId: formData.userId ? parseInt(formData.userId) : null,
      userName: formData.userId 
        ? mockUsers.find(u => u.id === parseInt(formData.userId))?.name || null
        : null,
      feedback: formData.feedback,
      category: formData.category,
      sentiment,
      createdAt: new Date(),
    };

    setFeedbackEntries([...feedbackEntries, newFeedback]);
    setIsAddDialogOpen(false);
    resetForm();
  };

  const analyzeSentiment = (text: string): 'positive' | 'neutral' | 'negative' => {
    const positiveWords = ['great', 'good', 'excellent', 'amazing', 'love', 'helpful'];
    const negativeWords = ['bad', 'poor', 'terrible', 'hate', 'awful', 'worst'];

    const words = text.toLowerCase().split(/\s+/);
    let score = 0;

    words.forEach(word => {
      if (positiveWords.includes(word)) score++;
      if (negativeWords.includes(word)) score--;
    });

    if (score > 0) return 'positive';
    if (score < 0) return 'negative';
    return 'neutral';
  };

  const handleDelete = (id: number) => {
    setFeedbackEntries(feedbackEntries.filter(feedback => feedback.id !== id));
  };

  const resetForm = () => {
    setFormData({
      userId: "",
      feedback: "",
      category: "",
    });
    setSelectedFeedback(null);
    setErrors({});
  };

  const handleExport = () => {
    const csvRows = [
      ['ID', 'User', 'Feedback', 'Category', 'Sentiment', 'Created At'],
      ...feedbackEntries.map(feedback => [
        feedback.id,
        feedback.userName || 'Anonymous',
        feedback.feedback,
        feedback.category,
        feedback.sentiment,
        format(feedback.createdAt, "PP"),
      ])
    ];

    const csvContent = csvRows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `feedback_${format(new Date(), "yyyy-MM-dd")}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getSentimentIcon = (sentiment: 'positive' | 'neutral' | 'negative') => {
    switch (sentiment) {
      case 'positive':
        return <SmileIcon className="h-4 w-4 text-green-500" />;
      case 'neutral':
        return <MehIcon className="h-4 w-4 text-yellow-500" />;
      case 'negative':
        return <FrownIcon className="h-4 w-4 text-red-500" />;
    }
  };

  const filteredFeedback = feedbackEntries.filter(feedback =>
    (filterCategory === "all" || feedback.category === filterCategory) &&
    (feedback.feedback.toLowerCase().includes(searchTerm.toLowerCase()) ||
     (feedback.userName?.toLowerCase() || '').includes(searchTerm.toLowerCase()))
  );

  const paginatedFeedback = filteredFeedback.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Feedback Management</h2>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleExport}>
                <DownloadIcon className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Feedback
              </Button>
            </div>
          </div>

          <div className="flex gap-4">
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-[180px]"
            />
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-[180px]"
            />
            <Input
              placeholder="Search feedback..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Feedback</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Sentiment</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedFeedback.map(feedback => (
                  <TableRow key={feedback.id}>
                    <TableCell>{feedback.userName || 'Anonymous'}</TableCell>
                    <TableCell className="max-w-md truncate">
                      {feedback.feedback}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{feedback.category}</Badge>
                    </TableCell>
                    <TableCell>
                      {getSentimentIcon(feedback.sentiment)}
                    </TableCell>
                    <TableCell>{format(feedback.createdAt, "PP")}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            setSelectedFeedback(feedback);
                            setIsViewDialogOpen(true);
                          }}
                        >
                          <EyeIcon className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="icon">
                              <TrashIcon className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Feedback</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this feedback?
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(feedback.id)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex justify-end items-center gap-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="text-sm">
              {currentPage}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => 
                Math.min(Math.ceil(filteredFeedback.length / itemsPerPage), prev + 1)
              )}
              disabled={currentPage === Math.ceil(filteredFeedback.length / itemsPerPage)}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      {/* Add/Edit Feedback Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Feedback</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label>User (Optional)</label>
              <Select
                value={formData.userId}
                onValueChange={(value) => setFormData({ ...formData, userId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="anonymous">Anonymous</SelectItem>
                  {mockUsers.map(user => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label>Category</label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="text-sm text-red-500">{errors.category}</p>
              )}
            </div>

            <div className="space-y-2">
              <label>Feedback</label>
              <Textarea
                value={formData.feedback}
                onChange={(e) => setFormData({ ...formData, feedback: e.target.value })}
                placeholder="Enter feedback"
                rows={4}
              />
              {errors.feedback && (
                <p className="text-sm text-red-500">{errors.feedback}</p>
              )}
              <p className="text-sm text-muted-foreground">
                {formData.feedback.length}/1000 characters
              </p>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAddDialogOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit">
                Save Feedback
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Feedback Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>View Feedback</DialogTitle>
          </DialogHeader>
          {selectedFeedback && (
            <div className="space-y-4">
              <div>
                <label className="font-semibold">User</label>
                <p>{selectedFeedback.userName || 'Anonymous'}</p>
              </div>
              <div>
                <label className="font-semibold">Category</label>
                <p>{selectedFeedback.category}</p>
              </div>
              <div>
                <label className="font-semibold">Feedback</label>
                <p className="whitespace-pre-wrap">{selectedFeedback.feedback}</p>
              </div>
              <div>
                <label className="font-semibold">Sentiment</label>
                <div className="flex items-center gap-2">
                  {getSentimentIcon(selectedFeedback.sentiment)}
                  <span className="capitalize">{selectedFeedback.sentiment}</span>
                </div>
              </div>
              <div>
                <label className="font-semibold">Created At</label>
                <p>{format(selectedFeedback.createdAt, "PPp")}</p>
              </div>
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => setIsViewDialogOpen(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Feedback;
