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
import { format } from "date-fns";
import { 
  EyeIcon, 
  TrashIcon, 
  PlusIcon, 
  DownloadIcon,
  BarChart3Icon 
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/admin/components/ui/tabs";

interface User {
  id: number;
  name: string;
}

interface Integration {
  id: number;
  userId: number;
  userName: string;
  platform: string;
  socialId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Mock data
const mockUsers: User[] = [
  { id: 1, name: "John Doe" },
  { id: 2, name: "Jane Smith" },
];

const platforms = [
  "Facebook",
  "Google",
  "Twitter",
  "Instagram",
  "LinkedIn"
];

const mockIntegrations: Integration[] = [
  {
    id: 1,
    userId: 1,
    userName: "John Doe",
    platform: "Facebook",
    socialId: "fb_123456789",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  // Add more mock data as needed
];

type FormData = {
  userId: string;
  platform: string;
  socialId: string;
  isActive: boolean;
};

const SocialMediaIntegrations = () => {
  const [integrations, setIntegrations] = useState<Integration[]>(mockIntegrations);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isStatsDialogOpen, setIsStatsDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterPlatform, setFilterPlatform] = useState<string>("all");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const itemsPerPage = 5;

  const [formData, setFormData] = useState<FormData>({
    userId: "",
    platform: "",
    socialId: "",
    isActive: true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validation
    if (!formData.userId) {
      setErrors(prev => ({ ...prev, userId: "User is required" }));
      return;
    }

    if (!formData.platform) {
      setErrors(prev => ({ ...prev, platform: "Platform is required" }));
      return;
    }

    if (!formData.socialId.trim()) {
      setErrors(prev => ({ ...prev, socialId: "Social ID is required" }));
      return;
    }

    // Check for duplicate integration
    const isDuplicate = integrations.some(
      integration => 
        integration.userId === parseInt(formData.userId) &&
        integration.platform === formData.platform &&
        integration.id !== selectedIntegration?.id
    );

    if (isDuplicate) {
      setErrors(prev => ({ ...prev, platform: "User already has an integration for this platform" }));
      return;
    }

    if (selectedIntegration) {
      // Update existing integration
      setIntegrations(integrations.map(integration =>
        integration.id === selectedIntegration.id
          ? {
              ...integration,
              userId: parseInt(formData.userId),
              userName: mockUsers.find(u => u.id === parseInt(formData.userId))?.name || "",
              platform: formData.platform,
              socialId: formData.socialId,
              isActive: formData.isActive,
              updatedAt: new Date(),
            }
          : integration
      ));
    } else {
      // Add new integration
      setIntegrations([
        ...integrations,
        {
          id: Math.max(...integrations.map(i => i.id)) + 1,
          userId: parseInt(formData.userId),
          userName: mockUsers.find(u => u.id === parseInt(formData.userId))?.name || "",
          platform: formData.platform,
          socialId: formData.socialId,
          isActive: formData.isActive,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
    }

    setIsAddDialogOpen(false);
    resetForm();
  };

  const handleDelete = (id: number) => {
    setIntegrations(integrations.filter(integration => integration.id !== id));
  };

  const handleStatusToggle = (id: number) => {
    setIntegrations(integrations.map(integration =>
      integration.id === id
        ? { ...integration, isActive: !integration.isActive, updatedAt: new Date() }
        : integration
    ));
  };

  const resetForm = () => {
    setFormData({
      userId: "",
      platform: "",
      socialId: "",
      isActive: true,
    });
    setSelectedIntegration(null);
    setErrors({});
  };

  const handleExport = () => {
    const csvRows = [
      ['ID', 'User', 'Platform', 'Social ID', 'Status', 'Created At', 'Updated At'],
      ...integrations.map(integration => [
        integration.id,
        integration.userName,
        integration.platform,
        integration.socialId,
        integration.isActive ? 'Active' : 'Inactive',
        format(integration.createdAt, "PP"),
        format(integration.updatedAt, "PP"),
      ])
    ];

    const csvContent = csvRows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `social_media_integrations_${format(new Date(), "yyyy-MM-dd")}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getPlatformStats = () => {
    const stats = platforms.map(platform => ({
      platform,
      count: integrations.filter(i => i.platform === platform).length,
    }));
    return stats.sort((a, b) => b.count - a.count);
  };

  const filteredIntegrations = integrations.filter(integration =>
    (filterPlatform === "all" || integration.platform === filterPlatform) &&
    (integration.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
     integration.platform.toLowerCase().includes(searchTerm.toLowerCase()) ||
     integration.socialId.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const paginatedIntegrations = filteredIntegrations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Social Media Integrations</h2>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleExport}>
                <DownloadIcon className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" onClick={() => setIsStatsDialogOpen(true)}>
                <BarChart3Icon className="h-4 w-4 mr-2" />
                Statistics
              </Button>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Integration
              </Button>
            </div>
          </div>

          <div className="flex gap-4">
            <Input
              placeholder="Search integrations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Select value={filterPlatform} onValueChange={setFilterPlatform}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All platforms</SelectItem>
                {platforms.map(platform => (
                  <SelectItem key={platform} value={platform}>
                    {platform}
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
                  <TableHead>Platform</TableHead>
                  <TableHead>Social ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedIntegrations.map(integration => (
                  <TableRow key={integration.id}>
                    <TableCell>{integration.userName}</TableCell>
                    <TableCell>{integration.platform}</TableCell>
                    <TableCell>{integration.socialId}</TableCell>
                    <TableCell>
                      <Switch
                        checked={integration.isActive}
                        onCheckedChange={() => handleStatusToggle(integration.id)}
                      />
                    </TableCell>
                    <TableCell>{format(integration.createdAt, "PP")}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            setSelectedIntegration(integration);
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
                              <AlertDialogTitle>Delete Integration</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this integration?
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(integration.id)}
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
                Math.min(Math.ceil(filteredIntegrations.length / itemsPerPage), prev + 1)
              )}
              disabled={currentPage === Math.ceil(filteredIntegrations.length / itemsPerPage)}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      {/* Add Integration Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedIntegration ? "Edit Integration" : "Add New Integration"}
            </DialogTitle>
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
              <label>Platform</label>
              <Select
                value={formData.platform}
                onValueChange={(value) => setFormData({ ...formData, platform: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a platform" />
                </SelectTrigger>
                <SelectContent>
                  {platforms.map(platform => (
                    <SelectItem key={platform} value={platform}>
                      {platform}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.platform && (
                <p className="text-sm text-red-500">{errors.platform}</p>
              )}
            </div>

            <div className="space-y-2">
              <label>Social ID</label>
              <Input
                value={formData.socialId}
                onChange={(e) => setFormData({ ...formData, socialId: e.target.value })}
                placeholder="Enter social media ID"
              />
              {errors.socialId && (
                <p className="text-sm text-red-500">{errors.socialId}</p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
              <label>Active</label>
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
                {selectedIntegration ? "Update" : "Add"} Integration
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Integration Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>View Integration</DialogTitle>
          </DialogHeader>
          {selectedIntegration && (
            <div className="space-y-4">
              <div>
                <label className="font-semibold">User</label>
                <p>{selectedIntegration.userName}</p>
              </div>
              <div>
                <label className="font-semibold">Platform</label>
                <p>{selectedIntegration.platform}</p>
              </div>
              <div>
                <label className="font-semibold">Social ID</label>
                <p>{selectedIntegration.socialId}</p>
              </div>
              <div>
                <label className="font-semibold">Status</label>
                <p className={selectedIntegration.isActive ? "text-green-600" : "text-red-600"}>
                  {selectedIntegration.isActive ? "Active" : "Inactive"}
                </p>
              </div>
              <div>
                <label className="font-semibold">Created At</label>
                <p>{format(selectedIntegration.createdAt, "PPp")}</p>
              </div>
              <div>
                <label className="font-semibold">Updated At</label>
                <p>{format(selectedIntegration.updatedAt, "PPp")}</p>
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

      {/* Statistics Dialog */}
      <Dialog open={isStatsDialogOpen} onOpenChange={setIsStatsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Platform Statistics</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {getPlatformStats().map(stat => (
              <div key={stat.platform} className="flex justify-between items-center">
                <span>{stat.platform}</span>
                <span className="font-semibold">{stat.count} users</span>
              </div>
            ))}
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

export default SocialMediaIntegrations; 