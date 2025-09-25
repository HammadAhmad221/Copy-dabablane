import { useState } from "react";
import { Card } from "@/admin/components/ui/card";
import { Input } from "@/admin/components/ui/input";
import { Button } from "@/admin/components/ui/button";
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
  DialogTrigger,
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
import { Textarea } from "@/admin/components/ui/textarea";
import { format } from "date-fns";
import { 
  EyeIcon, 
  TrashIcon, 
  FlagIcon, 
  StarIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from "lucide-react";
import { Progress } from "@/admin/components/ui/progress";

interface Rating {
  id: number;
  blaneId: number;
  blaneName: string;
  userId: number;
  userName: string;
  rating: number;
  review: string;
  isFlagged: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Blane {
  id: number;
  name: string;
}

interface User {
  id: number;
  name: string;
}

// Mock data
const mockRatings: Rating[] = [
  {
    id: 1,
    blaneId: 1,
    blaneName: "Blane 1",
    userId: 1,
    userName: "John Doe",
    rating: 5,
    review: "Great product!",
    isFlagged: false,
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
  },
  {
    id: 2,
    blaneId: 1,
    blaneName: "Blane 1",
    userId: 2,
    userName: "Jane Smith",
    rating: 4,
    review: "Good but could be better",
    isFlagged: true,
    createdAt: "2024-01-02",
    updatedAt: "2024-01-02",
  },
];

const mockBlanes: Blane[] = [
  { id: 1, name: "Blane 1" },
  { id: 2, name: "Blane 2" },
];

const mockUsers: User[] = [
  { id: 1, name: "John Doe" },
  { id: 2, name: "Jane Smith" },
];

const Ratings = () => {
  const [ratings, setRatings] = useState<Rating[]>(mockRatings);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRating, setSelectedRating] = useState<Rating | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterRating, setFilterRating] = useState<string>("");
  const itemsPerPage = 5;

  // Calculate statistics
  const calculateStats = (blaneId: number) => {
    const blaneRatings = ratings.filter(r => r.blaneId === blaneId);
    const total = blaneRatings.length;
    if (total === 0) return null;

    const average = blaneRatings.reduce((acc, r) => acc + r.rating, 0) / total;
    const distribution = Array.from({ length: 5 }, (_, i) => {
      const count = blaneRatings.filter(r => r.rating === i + 1).length;
      return (count / total) * 100;
    });

    return { average, distribution, total };
  };

  const handleDelete = (ratingId: number) => {
    setRatings(ratings.filter(rating => rating.id !== ratingId));
  };

  const handleFlag = (ratingId: number) => {
    setRatings(ratings.map(rating =>
      rating.id === ratingId
        ? { ...rating, isFlagged: !rating.isFlagged }
        : rating
    ));
  };

  const filteredRatings = ratings.filter(rating => {
    const matchesSearch = 
      rating.blaneName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rating.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rating.review.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRating = filterRating === "all" || rating.rating === parseInt(filterRating);
    
    return matchesSearch && matchesRating;
  });

  // Pagination
  const totalPages = Math.ceil(filteredRatings.length / itemsPerPage);
  const paginatedRatings = filteredRatings.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Ratings Management</h2>
        </div>

        <div className="space-y-4">
          <div className="flex gap-4">
            <Input
              placeholder="Search ratings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Select value={filterRating} onValueChange={setFilterRating}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by rating" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All ratings</SelectItem>
                {[5, 4, 3, 2, 1].map(rating => (
                  <SelectItem key={rating} value={rating.toString()}>
                    {rating} {rating === 1 ? 'star' : 'stars'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {mockBlanes.map(blane => {
              const stats = calculateStats(blane.id);
              if (!stats) return null;

              return (
                <Card key={blane.id} className="p-4">
                  <h3 className="font-semibold mb-2">{blane.name}</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold">{stats.average.toFixed(1)}</span>
                      <div className="flex">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <StarIcon
                            key={i}
                            className={`h-4 w-4 ${
                              i < Math.round(stats.average)
                                ? "text-yellow-400 fill-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-500">
                        ({stats.total} ratings)
                      </span>
                    </div>
                    <div className="space-y-1">
                      {stats.distribution.reverse().map((percentage, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="w-12 text-sm">{5 - i} stars</span>
                          <Progress value={percentage} className="h-2" />
                          <span className="w-12 text-sm">{percentage.toFixed(1)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Blane</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Review</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>Updated At</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedRatings.map((rating) => (
                  <TableRow key={rating.id}>
                    <TableCell>{rating.id}</TableCell>
                    <TableCell>{rating.blaneName}</TableCell>
                    <TableCell>{rating.userName}</TableCell>
                    <TableCell>
                      <div className="flex">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <StarIcon
                            key={i}
                            className={`h-4 w-4 ${
                              i < rating.rating
                                ? "text-yellow-400 fill-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {rating.review}
                    </TableCell>
                    <TableCell>{rating.createdAt}</TableCell>
                    <TableCell>{rating.updatedAt}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            setSelectedRating(rating);
                            setIsViewDialogOpen(true);
                          }}
                        >
                          <EyeIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleFlag(rating.id)}
                          className={rating.isFlagged ? "text-red-500" : ""}
                        >
                          <FlagIcon className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="icon">
                              <TrashIcon className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Rating</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this rating?
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(rating.id)}
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
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      {/* View Rating Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>View Rating</DialogTitle>
          </DialogHeader>
          {selectedRating && (
            <div className="space-y-4">
              <div>
                <label className="font-semibold">Blane</label>
                <p>{selectedRating.blaneName}</p>
              </div>
              <div>
                <label className="font-semibold">User</label>
                <p>{selectedRating.userName}</p>
              </div>
              <div>
                <label className="font-semibold">Rating</label>
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <StarIcon
                      key={i}
                      className={`h-4 w-4 ${
                        i < selectedRating.rating
                          ? "text-yellow-400 fill-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
              </div>
              <div>
                <label className="font-semibold">Review</label>
                <p className="whitespace-pre-wrap">{selectedRating.review}</p>
              </div>
              <div>
                <label className="font-semibold">Status</label>
                <p>{selectedRating.isFlagged ? "Flagged" : "Not Flagged"}</p>
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

export default Ratings;
