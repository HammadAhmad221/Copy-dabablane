import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useToast } from '@/admin/components/ui/use-toast';
import { Button } from '@/admin/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/admin/components/ui/table';
import { Input } from '@/admin/components/ui/input';
import CustomerService from '@/admin/lib/api/services/customerService';
import { Customer } from '@/lib/types/customer';
import { Loader2, DownloadIcon } from 'lucide-react';
import { Card } from '@/admin/components/ui/card';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/admin/components/ui/pagination";
import { format } from 'date-fns';
import { utils, writeFile } from 'xlsx';
import { toast } from 'react-hot-toast';
import { debounce } from 'lodash';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/admin/components/ui/select";
import { Icon } from "@iconify/react";

const Customers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [paginationSize, setPaginationSize] = useState<number>(10);

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await CustomerService.getAll();
      setCustomers(response.data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch customers"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Filter customers based on search
  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) =>
      Object.values(customer).some((value) =>
        String(value).toLowerCase().includes(search.toLowerCase())
      )
    );
  }, [customers, search]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredCustomers.length / paginationSize);
  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * paginationSize;
    const end = start + paginationSize;
    return filteredCustomers.slice(start, end);
  }, [filteredCustomers, currentPage, paginationSize]);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle pagination size change
  const handlePaginationSizeChange = useCallback((value: string) => {
    const newSize = parseInt(value, 10);
    setPaginationSize(newSize);
    setCurrentPage(1); // Reset to first page when changing size
  }, []);

  // Update search to reset pagination
  const handleSearch = (value: string) => {
    setSearch(value);
    setCurrentPage(1); // Reset to first page when searching
  };

  // Export function
  const handleExport = async () => {
    try {
      const exportData = customers.map(customer => ({
        ID: customer.id,
        Name: customer.name,
        Email: customer.email,
        Phone: customer.phone,
        Address: customer.address,
        City: customer.city,
        'Created At': format(new Date(customer.created_at), "yyyy-MM-dd HH:mm:ss"),
        'Updated At': format(new Date(customer.updated_at), "yyyy-MM-dd HH:mm:ss"),
      }));

      const ws = utils.json_to_sheet(exportData);
      const wb = utils.book_new();
      utils.book_append_sheet(wb, ws, "Customers");

      // Auto-size columns
      const maxWidth = 50;
      const colWidths = Object.keys(exportData[0] || {}).map(key => {
        const maxContentLength = Math.max(
          key.length,
          ...exportData.map(row => String(row[key as keyof typeof row] || '').length)
        );
        return { wch: Math.min(maxContentLength + 2, maxWidth) };
      });
      ws['!cols'] = colWidths;

      writeFile(wb, `customers_export_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
      toast({
        title: "Export Successful",
        description: `Successfully exported ${exportData.length} customers`,
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export data",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className=" ">
      <Card className="overflow-hidden">
        {/* Header Section - Translated */}
        <div className="p-4 md:p-6 bg-gradient-to-r from-[#00897B] to-[#00796B]">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="text-white">
              <h2 className="text-2xl font-bold">Gestion des clients</h2>
              <p className="text-gray-100 mt-1">Gérez votre base de données clients</p>
            </div>
            <Button 
              onClick={handleExport}
              className="bg-white text-[#00897B] hover:bg-gray-100 transition-colors"
            >
              <DownloadIcon className="h-4 w-4 mr-2" />
              Exporter
            </Button>
          </div>
        </div>

        {/* Search and Pagination Size Section - Translated */}
        <div className="p-4 border-b">
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              placeholder="Rechercher des clients..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="max-w-md"
            />
            <Select
              value={paginationSize.toString()}
              onValueChange={handlePaginationSizeChange}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Éléments par page" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 par page</SelectItem>
                <SelectItem value="20">20 par page</SelectItem>
                <SelectItem value="50">50 par page</SelectItem>
                <SelectItem value="100">100 par page</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table Section - Translated */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-[100px] hidden md:table-cell">ID</TableHead>
                <TableHead>Détails</TableHead>
                <TableHead className="hidden md:table-cell">Email</TableHead>
                <TableHead className="hidden md:table-cell">Téléphone</TableHead>
                <TableHead className="hidden lg:table-cell">Ville</TableHead>
                <TableHead className="hidden lg:table-cell">Créé le</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedCustomers.map((customer) => (
                <TableRow key={customer.id} className="group hover:bg-gray-50">
                  <TableCell className="hidden md:table-cell">{customer.id}</TableCell>
                  <TableCell>
                    <div className="flex flex-col space-y-1">
                      <div className="font-medium text-base">
                        {customer.name}
                      </div>
                      <div className="md:hidden space-y-1 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">ID :</span>
                          {customer.id}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Email :</span>
                          {customer.email}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Téléphone :</span>
                          {customer.phone}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Ville :</span>
                          {customer.city}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Créé le :</span>
                          {format(new Date(customer.created_at), "PP")}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{customer.email}</TableCell>
                  <TableCell className="hidden md:table-cell">{customer.phone}</TableCell>
                  <TableCell className="hidden lg:table-cell">{customer.city}</TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {format(new Date(customer.created_at), "PP")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination - Translated */}
        <div className="p-4">
          <Pagination className="justify-end">
            <PaginationContent>
              <PaginationItem>
                {currentPage > 1 && (
                  <PaginationPrevious
                    onClick={() => handlePageChange(currentPage - 1)}
                  />
                )}
              </PaginationItem>
              {Array.from(
                { length: Math.min(5, totalPages) },
                (_, i) => {
                  const page = Math.max(
                    1,
                    Math.min(
                      currentPage - 2,
                      totalPages - 4
                    )
                  ) + i;
                  return (
                    <PaginationItem key={page}>
                      <PaginationLink
                        isActive={page === currentPage}
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  );
                }
              )}
              <PaginationItem>
                {currentPage < totalPages && (
                  <PaginationNext
                    onClick={() => handlePageChange(currentPage + 1)}
                  />
                )}
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </Card>
    </div>
  );
};

export default Customers; 