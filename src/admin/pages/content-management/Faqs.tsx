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
import { format } from "date-fns";
import { 
  EyeIcon, 
  TrashIcon, 
  PencilIcon, 
  PlusIcon, 
  DownloadIcon,
  MoveUpIcon,
  MoveDownIcon
} from "lucide-react";

interface FAQ {
  id: number;
  question: string;
  answer: string;
  category: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

// Mock categories
const categories = [
  "General",
  "Account",
  "Billing",
  "Technical Support",
  "Services"
];

// Mock data
const mockFaqs: FAQ[] = [
  {
    id: 1,
    question: "How do I reset my password?",
    answer: "You can reset your password by clicking the 'Forgot Password' link on the login page and following the instructions sent to your email.",
    category: "Account",
    order: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  // Add more mock data
];

type FormData = {
  question: string;
  answer: string;
  category: string;
};

const Faqs = () => {
  const [faqs, setFaqs] = useState<FAQ[]>(mockFaqs);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFaq, setSelectedFaq] = useState<FAQ | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const itemsPerPage = 5;

  const [formData, setFormData] = useState<FormData>({
    question: "",
    answer: "",
    category: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validation
    if (!formData.question.trim()) {
      setErrors(prev => ({ ...prev, question: "Question is required" }));
      return;
    }

    if (!formData.answer.trim()) {
      setErrors(prev => ({ ...prev, answer: "Answer is required" }));
      return;
    }

    if (formData.answer.length > 1000) {
      setErrors(prev => ({ ...prev, answer: "Answer must not exceed 1000 characters" }));
      return;
    }

    if (!formData.category) {
      setErrors(prev => ({ ...prev, category: "Category is required" }));
      return;
    }

    // Check for duplicate question
    const isDuplicateQuestion = faqs.some(
      faq => 
        faq.question.toLowerCase() === formData.question.toLowerCase() &&
        faq.id !== selectedFaq?.id
    );

    if (isDuplicateQuestion) {
      setErrors(prev => ({ ...prev, question: "This question already exists" }));
      return;
    }

    if (selectedFaq) {
      // Update existing FAQ
      setFaqs(faqs.map(faq =>
        faq.id === selectedFaq.id
          ? {
              ...faq,
              question: formData.question,
              answer: formData.answer,
              category: formData.category,
              updatedAt: new Date(),
            }
          : faq
      ));
    } else {
      // Add new FAQ
      const maxOrder = Math.max(...faqs.map(faq => faq.order), 0);
      setFaqs([
        ...faqs,
        {
          id: Math.max(...faqs.map(faq => faq.id)) + 1,
          question: formData.question,
          answer: formData.answer,
          category: formData.category,
          order: maxOrder + 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
    }

    setIsAddDialogOpen(false);
    resetForm();
  };

  const handleDelete = (id: number) => {
    setFaqs(faqs.filter(faq => faq.id !== id));
  };

  const handleMoveUp = (id: number) => {
    const index = faqs.findIndex(faq => faq.id === id);
    if (index > 0) {
      const newFaqs = [...faqs];
      const temp = newFaqs[index].order;
      newFaqs[index].order = newFaqs[index - 1].order;
      newFaqs[index - 1].order = temp;
      setFaqs(newFaqs.sort((a, b) => a.order - b.order));
    }
  };

  const handleMoveDown = (id: number) => {
    const index = faqs.findIndex(faq => faq.id === id);
    if (index < faqs.length - 1) {
      const newFaqs = [...faqs];
      const temp = newFaqs[index].order;
      newFaqs[index].order = newFaqs[index + 1].order;
      newFaqs[index + 1].order = temp;
      setFaqs(newFaqs.sort((a, b) => a.order - b.order));
    }
  };

  const resetForm = () => {
    setFormData({
      question: "",
      answer: "",
      category: "",
    });
    setSelectedFaq(null);
    setErrors({});
  };

  const handleExport = () => {
    const csvRows = [
      ['ID', 'Question', 'Answer', 'Category', 'Created At', 'Updated At'],
      ...faqs.map(faq => [
        faq.id,
        faq.question,
        faq.answer,
        faq.category,
        format(faq.createdAt, "PP"),
        format(faq.updatedAt, "PP"),
      ])
    ];

    const csvContent = csvRows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `faqs_${format(new Date(), "yyyy-MM-dd")}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredFaqs = faqs
    .filter(faq =>
      (filterCategory === "all" || faq.category === filterCategory) &&
      (faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
       faq.answer.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => a.order - b.order);

  const paginatedFaqs = filteredFaqs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">FAQs</h2>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleExport}>
                <DownloadIcon className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <PlusIcon className="h-4 w-4 mr-2" />
                Add FAQ
              </Button>
            </div>
          </div>

          <div className="flex gap-4">
            <Input
              placeholder="Search FAQs..."
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
                  <TableHead>Question</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>Updated At</TableHead>
                  <TableHead className="w-[150px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedFaqs.map(faq => (
                  <TableRow key={faq.id}>
                    <TableCell className="font-medium">{faq.question}</TableCell>
                    <TableCell>{faq.category}</TableCell>
                    <TableCell>{format(faq.createdAt, "PP")}</TableCell>
                    <TableCell>{format(faq.updatedAt, "PP")}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            setSelectedFaq(faq);
                            setIsViewDialogOpen(true);
                          }}
                        >
                          <EyeIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            setSelectedFaq(faq);
                            setFormData({
                              question: faq.question,
                              answer: faq.answer,
                              category: faq.category,
                            });
                            setIsAddDialogOpen(true);
                          }}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="icon">
                              <TrashIcon className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete FAQ</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this FAQ?
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(faq.id)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleMoveUp(faq.id)}
                          disabled={faq.order === Math.min(...faqs.map(f => f.order))}
                        >
                          <MoveUpIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleMoveDown(faq.id)}
                          disabled={faq.order === Math.max(...faqs.map(f => f.order))}
                        >
                          <MoveDownIcon className="h-4 w-4" />
                        </Button>
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
                Math.min(Math.ceil(filteredFaqs.length / itemsPerPage), prev + 1)
              )}
              disabled={currentPage === Math.ceil(filteredFaqs.length / itemsPerPage)}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      {/* Add/Edit FAQ Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedFaq ? "Edit FAQ" : "Add New FAQ"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label>Question</label>
              <Input
                value={formData.question}
                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                placeholder="Enter FAQ question"
              />
              {errors.question && (
                <p className="text-sm text-red-500">{errors.question}</p>
              )}
            </div>

            <div className="space-y-2">
              <label>Answer</label>
              <Textarea
                value={formData.answer}
                onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                placeholder="Enter FAQ answer"
                rows={6}
              />
              {errors.answer && (
                <p className="text-sm text-red-500">{errors.answer}</p>
              )}
              <p className="text-sm text-muted-foreground">
                {formData.answer.length}/1000 characters
              </p>
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
                {selectedFaq ? "Update" : "Add"} FAQ
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View FAQ Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>View FAQ</DialogTitle>
          </DialogHeader>
          {selectedFaq && (
            <div className="space-y-4">
              <div>
                <label className="font-semibold">Question</label>
                <p>{selectedFaq.question}</p>
              </div>
              <div>
                <label className="font-semibold">Answer</label>
                <p className="whitespace-pre-wrap">{selectedFaq.answer}</p>
              </div>
              <div>
                <label className="font-semibold">Category</label>
                <p>{selectedFaq.category}</p>
              </div>
              <div>
                <label className="font-semibold">Created At</label>
                <p>{format(selectedFaq.createdAt, "PPp")}</p>
              </div>
              <div>
                <label className="font-semibold">Updated At</label>
                <p>{format(selectedFaq.updatedAt, "PPp")}</p>
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

export default Faqs;
