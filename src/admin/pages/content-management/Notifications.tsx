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
import { Switch } from "@/admin/components/ui/switch";
import { Checkbox } from "@/admin/components/ui/checkbox";
import { format } from "date-fns";
import { 
  EyeIcon, 
  TrashIcon, 
  PlusIcon, 
  DownloadIcon,
  BarChart3Icon,
  CheckIcon,
  XIcon
} from "lucide-react";
import { Progress } from "@/admin/components/ui/progress";

interface User {
  id: number;
  name: string;
}

interface Notification {
  id: number;
  userId: number;
  userName: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
}

// Mock users
const mockUsers: User[] = [
  { id: 1, name: "John Doe" },
  { id: 2, name: "Jane Smith" },
];

// Mock data
const mockNotifications: Notification[] = [
  {
    id: 1,
    userId: 1,
    userName: "John Doe",
    message: "Your order has been confirmed",
    isRead: false,
    createdAt: new Date(),
  },
  // Add more mock data
];

type FormData = {
  userId: string;
  message: string;
};

const Notifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isStatsDialogOpen, setIsStatsDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedNotifications, setSelectedNotifications] = useState<number[]>([]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const itemsPerPage = 5;

  const [formData, setFormData] = useState<FormData>({
    userId: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!formData.userId) {
      setErrors(prev => ({ ...prev, userId: "User is required" }));
      return;
    }

    if (!formData.message.trim()) {
      setErrors(prev => ({ ...prev, message: "Message is required" }));
      return;
    }

    if (formData.message.length > 500) {
      setErrors(prev => ({ ...prev, message: "Message must not exceed 500 characters" }));
      return;
    }

    const newNotification: Notification = {
      id: Math.max(...notifications.map(n => n.id)) + 1,
      userId: parseInt(formData.userId),
      userName: mockUsers.find(u => u.id === parseInt(formData.userId))?.name || "",
      message: formData.message,
      isRead: false,
      createdAt: new Date(),
    };

    setNotifications([...notifications, newNotification]);
    setIsCreateDialogOpen(false);
    resetForm();
  };

  const handleDelete = (id: number) => {
    setNotifications(notifications.filter(notification => notification.id !== id));
  };

  const handleBulkDelete = () => {
    setNotifications(notifications.filter(notification => !selectedNotifications.includes(notification.id)));
    setSelectedNotifications([]);
  };

  const handleToggleRead = (id: number) => {
    setNotifications(notifications.map(notification =>
      notification.id === id
        ? { ...notification, isRead: !notification.isRead }
        : notification
    ));
  };

  const handleBulkToggleRead = (setRead: boolean) => {
    setNotifications(notifications.map(notification =>
      selectedNotifications.includes(notification.id)
        ? { ...notification, isRead: setRead }
        : notification
    ));
    setSelectedNotifications([]);
  };

  const resetForm = () => {
    setFormData({
      userId: "",
      message: "",
    });
    setSelectedNotification(null);
    setErrors({});
  };

  const handleExport = () => {
    const csvRows = [
      ['ID', 'User', 'Message', 'Status', 'Created At'],
      ...notifications.map(notification => [
        notification.id,
        notification.userName,
        notification.message,
        notification.isRead ? 'Read' : 'Unread',
        format(notification.createdAt, "PP"),
      ])
    ];

    const csvContent = csvRows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `notifications_${format(new Date(), "yyyy-MM-dd")}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStats = () => {
    const total = notifications.length;
    const read = notifications.filter(n => n.isRead).length;
    const readPercentage = total > 0 ? (read / total) * 100 : 0;

    return {
      total,
      read,
      unread: total - read,
      readPercentage,
    };
  };

  const filteredNotifications = notifications.filter(notification =>
    (filterStatus === "all" || 
     (filterStatus === "read" && notification.isRead) ||
     (filterStatus === "unread" && !notification.isRead)) &&
    (notification.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
     notification.message.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const paginatedNotifications = filteredNotifications.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Notifications</h2>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleExport}>
                <DownloadIcon className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" onClick={() => setIsStatsDialogOpen(true)}>
                <BarChart3Icon className="h-4 w-4 mr-2" />
                Stats
              </Button>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <PlusIcon className="h-4 w-4 mr-2" />
                Create Notification
              </Button>
            </div>
          </div>

          <div className="flex gap-4">
            <Input
              placeholder="Search notifications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All notifications</SelectItem>
                <SelectItem value="read">Read</SelectItem>
                <SelectItem value="unread">Unread</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {selectedNotifications.length > 0 && (
            <div className="flex items-center gap-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
              >
                Delete Selected ({selectedNotifications.length})
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkToggleRead(true)}
              >
                Mark as Read
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkToggleRead(false)}
              >
                Mark as Unread
              </Button>
            </div>
          )}

          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[30px]">
                    <Checkbox
                      checked={selectedNotifications.length === paginatedNotifications.length}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedNotifications(paginatedNotifications.map(n => n.id));
                        } else {
                          setSelectedNotifications([]);
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead className="w-[150px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedNotifications.map(notification => (
                  <TableRow key={notification.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedNotifications.includes(notification.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedNotifications([...selectedNotifications, notification.id]);
                          } else {
                            setSelectedNotifications(selectedNotifications.filter(id => id !== notification.id));
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell>{notification.userName}</TableCell>
                    <TableCell className="max-w-md truncate">
                      {notification.message}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={notification.isRead}
                        onCheckedChange={() => handleToggleRead(notification.id)}
                      />
                    </TableCell>
                    <TableCell>{format(notification.createdAt, "PP")}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            setSelectedNotification(notification);
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
                              <AlertDialogTitle>Delete Notification</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this notification?
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(notification.id)}
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
                Math.min(Math.ceil(filteredNotifications.length / itemsPerPage), prev + 1)
              )}
              disabled={currentPage === Math.ceil(filteredNotifications.length / itemsPerPage)}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      {/* Create Notification Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Notification</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label>User</label>
              <Select
                value={formData.userId}
                onValueChange={(value) => setFormData({ ...formData, userId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {mockUsers.map(user => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.userId && (
                <p className="text-sm text-red-500">{errors.userId}</p>
              )}
            </div>

            <div className="space-y-2">
              <label>Message</label>
              <Textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Enter notification message"
                rows={4}
              />
              {errors.message && (
                <p className="text-sm text-red-500">{errors.message}</p>
              )}
              <p className="text-sm text-muted-foreground">
                {formData.message.length}/500 characters
              </p>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit">
                Send Notification
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Notification Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>View Notification</DialogTitle>
          </DialogHeader>
          {selectedNotification && (
            <div className="space-y-4">
              <div>
                <label className="font-semibold">User</label>
                <p>{selectedNotification.userName}</p>
              </div>
              <div>
                <label className="font-semibold">Message</label>
                <p className="whitespace-pre-wrap">{selectedNotification.message}</p>
              </div>
              <div>
                <label className="font-semibold">Status</label>
                <p className={selectedNotification.isRead ? "text-green-600" : "text-yellow-600"}>
                  {selectedNotification.isRead ? "Read" : "Unread"}
                </p>
              </div>
              <div>
                <label className="font-semibold">Created At</label>
                <p>{format(selectedNotification.createdAt, "PPp")}</p>
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

      {/* Stats Dialog */}
      <Dialog open={isStatsDialogOpen} onOpenChange={setIsStatsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Notification Statistics</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <Card className="p-4">
                <div className="text-sm font-medium text-muted-foreground">Total</div>
                <div className="text-2xl font-bold">{getStats().total}</div>
              </Card>
              <Card className="p-4">
                <div className="text-sm font-medium text-muted-foreground">Read</div>
                <div className="text-2xl font-bold text-green-600">{getStats().read}</div>
              </Card>
              <Card className="p-4">
                <div className="text-sm font-medium text-muted-foreground">Unread</div>
                <div className="text-2xl font-bold text-yellow-600">{getStats().unread}</div>
              </Card>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Read Rate</span>
                <span>{getStats().readPercentage.toFixed(1)}%</span>
              </div>
              <Progress value={getStats().readPercentage} />
            </div>
            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={() => setIsStatsDialogOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Notifications;
