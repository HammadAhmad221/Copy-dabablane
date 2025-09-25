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
} from "@/admin/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/admin/components/ui/select";
import { Checkbox } from "@/admin/components/ui/checkbox";
import { format } from "date-fns";
import { 
  PencilIcon,
  TrashIcon,
  PlusIcon,
  DownloadIcon,
  PercentIcon,
  GlobeIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from "lucide-react";

interface TaxSetting {
  id: number;
  location: string;
  region: string;
  taxPercentage: number;
  createdAt: Date;
  updatedAt: Date;
}

// Mock data
const regions = [
  "Europe",
  "Asia",
  "North America",
  "South America",
  "Africa",
  "Oceania"
];

const mockTaxSettings: TaxSetting[] = [
  {
    id: 1,
    location: "United Kingdom",
    region: "Europe",
    taxPercentage: 20,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  // Add more mock data
];

type FormData = {
  location: string;
  region: string;
  taxPercentage: string;
};

const Tax = () => {
  const [taxSettings, setTaxSettings] = useState<TaxSetting[]>(mockTaxSettings);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSetting, setSelectedSetting] = useState<TaxSetting | null>(null);
  const [isAddEditDialogOpen, setIsAddEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [isBulkUpdateDialogOpen, setIsBulkUpdateDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [bulkTaxPercentage, setBulkTaxPercentage] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: keyof TaxSetting;
    direction: 'asc' | 'desc';
  } | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const itemsPerPage = 10;

  const [formData, setFormData] = useState<FormData>({
    location: "",
    region: "",
    taxPercentage: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!formData.location.trim()) {
      setErrors(prev => ({ ...prev, location: "Location is required" }));
      return;
    }

    if (!formData.region) {
      setErrors(prev => ({ ...prev, region: "Region is required" }));
      return;
    }

    const taxPercentage = parseFloat(formData.taxPercentage);
    if (isNaN(taxPercentage) || taxPercentage < 0 || taxPercentage > 100) {
      setErrors(prev => ({ ...prev, taxPercentage: "Valid tax percentage is required (0-100)" }));
      return;
    }

    // Check for duplicate location
    if (!selectedSetting && taxSettings.some(s => 
      s.location.toLowerCase() === formData.location.toLowerCase()
    )) {
      setErrors(prev => ({ ...prev, location: "Location already exists" }));
      return;
    }

    const newSetting: TaxSetting = {
      id: selectedSetting?.id || Math.max(...taxSettings.map(s => s.id)) + 1,
      location: formData.location,
      region: formData.region,
      taxPercentage,
      createdAt: selectedSetting?.createdAt || new Date(),
      updatedAt: new Date(),
    };

    if (selectedSetting) {
      setTaxSettings(prev => 
        prev.map(setting => setting.id === selectedSetting.id ? newSetting : setting)
      );
    } else {
      setTaxSettings(prev => [...prev, newSetting]);
    }

    setIsAddEditDialogOpen(false);
    resetForm();
  };

  const handleDelete = () => {
    if (selectedSetting) {
      setTaxSettings(prev => 
        prev.filter(setting => setting.id !== selectedSetting.id)
      );
      setIsDeleteDialogOpen(false);
      setSelectedSetting(null);
    }
  };

  const handleBulkDelete = () => {
    setTaxSettings(prev => 
      prev.filter(setting => !selectedItems.includes(setting.id))
    );
    setIsBulkDeleteDialogOpen(false);
    setSelectedItems([]);
  };

  const handleBulkUpdate = () => {
    const taxPercentage = parseFloat(bulkTaxPercentage);
    if (isNaN(taxPercentage) || taxPercentage < 0 || taxPercentage > 100) {
      return;
    }

    setTaxSettings(prev => 
      prev.map(setting => 
        selectedItems.includes(setting.id)
          ? { ...setting, taxPercentage, updatedAt: new Date() }
          : setting
      )
    );
    setIsBulkUpdateDialogOpen(false);
    setSelectedItems([]);
    setBulkTaxPercentage("");
  };

  const resetForm = () => {
    setFormData({
      location: "",
      region: "",
      taxPercentage: "",
    });
    setErrors({});
    setSelectedSetting(null);
  };

  const handleExport = () => {
    const csvRows = [
      ['ID', 'Location', 'Region', 'Tax Percentage', 'Created At', 'Updated At'],
      ...taxSettings.map(setting => [
        setting.id,
        setting.location,
        setting.region,
        `${setting.taxPercentage}%`,
        format(setting.createdAt, "PP"),
        format(setting.updatedAt, "PP"),
      ])
    ];

    const csvContent = csvRows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tax_settings_${format(new Date(), "yyyy-MM-dd")}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSort = (key: keyof TaxSetting) => {
    setSortConfig(current => ({
      key,
      direction: 
        current?.key === key && current.direction === 'asc'
          ? 'desc'
          : 'asc',
    }));
  };

  const getSortedData = (data: TaxSetting[]) => {
    if (!sortConfig) return data;

    return [...data].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  };

  const filteredSettings = taxSettings.filter(setting => {
    const matchesSearch = 
      setting.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      setting.taxPercentage.toString().includes(searchTerm);
    
    const matchesRegion = selectedRegion === "all" || setting.region === selectedRegion;

    return matchesSearch && matchesRegion;
  });

  const sortedSettings = getSortedData(filteredSettings);

  const paginatedSettings = sortedSettings.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      {/* Data Table */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex flex-wrap items-end gap-4">
            <Input
              placeholder="Search tax settings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Select value={selectedRegion} onValueChange={setSelectedRegion}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by region" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All regions</SelectItem>
                {regions.map(region => (
                  <SelectItem key={region} value={region}>{region}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2 ml-auto">
              <Button
                variant="outline"
                onClick={handleExport}
                className="flex items-center gap-2"
              >
                Export
                <DownloadIcon className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => {
                  setIsAddEditDialogOpen(true);
                  resetForm();
                }}
                className="flex items-center gap-2"
              >
                <PlusIcon className="h-4 w-4" />
                Add Tax Setting
              </Button>
            </div>
          </div>

          {selectedItems.length > 0 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setIsBulkUpdateDialogOpen(true)}
              >
                Update Selected
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsBulkDeleteDialogOpen(true)}
              >
                Delete Selected
              </Button>
            </div>
          )}

          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">
                    <Checkbox
                      checked={selectedItems.length === paginatedSettings.length}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedItems(paginatedSettings.map(s => s.id));
                        } else {
                          setSelectedItems([]);
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleSort('location')}
                  >
                    <div className="flex items-center gap-2">
                      Location
                      {sortConfig?.key === 'location' && (
                        sortConfig.direction === 'asc' ? <ArrowUpIcon className="h-4 w-4" /> : <ArrowDownIcon className="h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleSort('taxPercentage')}
                  >
                    <div className="flex items-center gap-2">
                      Tax Percentage
                      {sortConfig?.key === 'taxPercentage' && (
                        sortConfig.direction === 'asc' ? <ArrowUpIcon className="h-4 w-4" /> : <ArrowDownIcon className="h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead>Updated At</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedSettings.map(setting => (
                  <TableRow key={setting.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedItems.includes(setting.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedItems(prev => [...prev, setting.id]);
                          } else {
                            setSelectedItems(prev => prev.filter(id => id !== setting.id));
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell>{setting.location}</TableCell>
                    <TableCell>{setting.region}</TableCell>
                    <TableCell>{setting.taxPercentage}%</TableCell>
                    <TableCell>{format(setting.updatedAt, "PP")}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            setSelectedSetting(setting);
                            setFormData({
                              location: setting.location,
                              region: setting.region,
                              taxPercentage: setting.taxPercentage.toString(),
                            });
                            setIsAddEditDialogOpen(true);
                          }}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            setSelectedSetting(setting);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <TrashIcon className="h-4 w-4" />
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
                Math.min(Math.ceil(sortedSettings.length / itemsPerPage), prev + 1)
              )}
              disabled={currentPage === Math.ceil(sortedSettings.length / itemsPerPage)}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isAddEditDialogOpen} onOpenChange={setIsAddEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedSetting ? "Edit Tax Setting" : "Add Tax Setting"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label>Location</label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Enter location"
              />
              {errors.location && (
                <p className="text-sm text-red-500">{errors.location}</p>
              )}
            </div>

            <div className="space-y-2">
              <label>Region</label>
              <Select
                value={formData.region}
                onValueChange={(value) => setFormData({ ...formData, region: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a region" />
                </SelectTrigger>
                <SelectContent>
                  {regions.map(region => (
                    <SelectItem key={region} value={region}>{region}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.region && (
                <p className="text-sm text-red-500">{errors.region}</p>
              )}
            </div>

            <div className="space-y-2">
              <label>Tax Percentage</label>
              <Input
                type="number"
                step="0.01"
                value={formData.taxPercentage}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  taxPercentage: e.target.value 
                })}
                placeholder="Enter tax percentage"
              />
              {errors.taxPercentage && (
                <p className="text-sm text-red-500">{errors.taxPercentage}</p>
              )}
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAddEditDialogOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit">
                {selectedSetting ? "Update" : "Add"} Tax Setting
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the tax setting
              for {selectedSetting?.location}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Dialog */}
      <AlertDialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete {selectedItems.length} tax settings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsBulkDeleteDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete}>
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Update Dialog */}
      <Dialog open={isBulkUpdateDialogOpen} onOpenChange={setIsBulkUpdateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Tax Percentage</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label>New Tax Percentage</label>
              <Input
                type="number"
                step="0.01"
                value={bulkTaxPercentage}
                onChange={(e) => setBulkTaxPercentage(e.target.value)}
                placeholder="Enter new tax percentage"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsBulkUpdateDialogOpen(false);
                  setBulkTaxPercentage("");
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleBulkUpdate}>
                Update {selectedItems.length} Settings
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Tax;
