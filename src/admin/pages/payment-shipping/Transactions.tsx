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
  DownloadIcon,
  RefreshCwIcon,
  DollarSignIcon,
  CreditCardIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  XCircleIcon
} from "lucide-react";
import { motion } from 'framer-motion';
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";

interface Transaction {
  id: number;
  orderId: number;
  userId: number;
  userName: string;
  amount: number;
  paymentMethod: string;
  status: 'success' | 'failed' | 'pending';
  createdAt: Date;
}

interface RefundData {
  transactionId: number;
  amount: number;
  reason: string;
}

// Mock data
const mockTransactions: Transaction[] = [
  {
    id: 1,
    orderId: 1001,
    userId: 1,
    userName: "John Doe",
    amount: 299.99,
    paymentMethod: "Credit Card",
    status: "success",
    createdAt: new Date(),
  },
  // Add more mock data
];

const paymentMethods = [
  "Credit Card",
  "PayPal",
  "Bank Transfer",
  "Crypto",
];

const Transactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isRefundDialogOpen, setIsRefundDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const itemsPerPage = 10;

  const [refundData, setRefundData] = useState<RefundData>({
    transactionId: 0,
    amount: 0,
    reason: "",
  });

  const handleRefund = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!refundData.amount) {
      setErrors(prev => ({ ...prev, amount: "Refund amount is required" }));
      return;
    }

    if (selectedTransaction && refundData.amount > selectedTransaction.amount) {
      setErrors(prev => ({ ...prev, amount: "Refund amount cannot exceed transaction amount" }));
      return;
    }

    if (!refundData.reason.trim()) {
      setErrors(prev => ({ ...prev, reason: "Reason for refund is required" }));
      return;
    }

    // Process refund logic here
    setIsRefundDialogOpen(false);
    resetRefundForm();
  };

  const resetRefundForm = () => {
    setRefundData({
      transactionId: 0,
      amount: 0,
      reason: "",
    });
    setErrors({});
  };

  const handleExport = () => {
    const csvRows = [
      ['ID', 'Order ID', 'User', 'Amount', 'Payment Method', 'Status', 'Created At'],
      ...transactions.map(transaction => [
        transaction.id,
        transaction.orderId,
        transaction.userName,
        transaction.amount,
        transaction.paymentMethod,
        transaction.status,
        format(transaction.createdAt, "PP"),
      ])
    ];

    const csvContent = csvRows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `transactions_${format(new Date(), "yyyy-MM-dd")}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusIcon = (status: 'success' | 'failed' | 'pending') => {
    switch (status) {
      case 'success':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircleIcon className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <AlertCircleIcon className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getInsights = () => {
    const total = transactions.length;
    const totalRevenue = transactions
      .filter(t => t.status === 'success')
      .reduce((sum, t) => sum + t.amount, 0);
    const failedCount = transactions.filter(t => t.status === 'failed').length;

    return {
      total,
      totalRevenue,
      failedCount,
      successRate: ((total - failedCount) / total) * 100,
    };
  };

  const filteredTransactions = transactions.filter(transaction => {
    // Status filter
    const matchesStatus = filterStatus === "all" || transaction.status === filterStatus;
    
    // Text search filter
    const matchesSearch = 
      transaction.orderId.toString().includes(searchTerm) ||
      transaction.userId.toString().includes(searchTerm) ||
      transaction.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.paymentMethod.toLowerCase().includes(searchTerm.toLowerCase());

    // Date range filter
    const transactionDate = new Date(transaction.createdAt);
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;

    // Set end date to end of day
    if (end) {
      end.setHours(23, 59, 59, 999);
    }

    const withinDateRange = 
      (!start || transactionDate >= start) && 
      (!end || transactionDate <= end);

    return matchesStatus && matchesSearch && withinDateRange;
  });

  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="">
      <Card className="p-6 shadow-lg border-0">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header with gradient background */}
          <div className="p-6 -mx-6 -mt-6 mb-6 bg-gradient-to-r from-[#00897B] to-[#00796B] rounded-t-lg">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="text-white">
                <h2 className="text-2xl font-bold">Transaction Management</h2>
                <p className="text-gray-100 mt-1">Monitor and manage payment transactions</p>
              </div>
            </div>
          </div>

          {/* Insights Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4 bg-white shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Icon icon="lucide:credit-card" className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Transactions</p>
                  <p className="text-2xl font-bold">{getInsights().total}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4 bg-white shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-50 rounded-lg">
                  <Icon icon="lucide:dollar-sign" className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${getInsights().totalRevenue.toFixed(2)}
                  </p>
                </div>
              </div>
            </Card>
            <Card className="p-4 bg-white shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-50 rounded-lg">
                  <Icon icon="lucide:alert-circle" className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Failed Transactions</p>
                  <p className="text-2xl font-bold text-red-600">{getInsights().failedCount}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4 bg-white shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-50 rounded-lg">
                  <Icon icon="lucide:alert-circle" className="h-5 w-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                  <p className="text-2xl font-bold">{getInsights().successRate.toFixed(1)}%</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Search and Filters */}
          <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <div className="text-sm font-medium mb-2">Start Date</div>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-white"
                />
              </div>
              <div>
                <div className="text-sm font-medium mb-2">End Date</div>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-white"
                />
              </div>
              <div>
                <div className="text-sm font-medium mb-2">Status</div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full bg-white">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <div className="text-sm font-medium mb-2">Search</div>
                <div className="relative">
                  <Input
                    placeholder="Search transactions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white pl-10"
                  />
                  <Icon 
                    icon="lucide:search" 
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" 
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={handleExport}
                className="flex items-center gap-2"
              >
                <Icon icon="lucide:download" className="h-4 w-4" />
                Export
              </Button>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="w-full overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 border-b border-gray-200">
                    <TableHead className="font-semibold">Order ID</TableHead>
                    <TableHead className="font-semibold">User</TableHead>
                    <TableHead className="font-semibold">Amount</TableHead>
                    <TableHead className="font-semibold">Payment Method</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Created At</TableHead>
                    <TableHead className="font-semibold w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedTransactions.map(transaction => (
                    <TableRow key={transaction.id}>
                      <TableCell>#{transaction.orderId}</TableCell>
                      <TableCell>{transaction.userName}</TableCell>
                      <TableCell>${transaction.amount.toFixed(2)}</TableCell>
                      <TableCell>{transaction.paymentMethod}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(transaction.status)}
                          <span className="capitalize">{transaction.status}</span>
                        </div>
                      </TableCell>
                      <TableCell>{format(transaction.createdAt, "PP")}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              setSelectedTransaction(transaction);
                              setIsViewDialogOpen(true);
                            }}
                          >
                            <EyeIcon className="h-4 w-4" />
                          </Button>
                          {transaction.status === 'success' && (
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => {
                                setSelectedTransaction(transaction);
                                setRefundData({
                                  transactionId: transaction.id,
                                  amount: transaction.amount,
                                  reason: "",
                                });
                                setIsRefundDialogOpen(true);
                              }}
                            >
                              <RefreshCwIcon className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex justify-end border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
            <div className="flex items-center gap-6">
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
                  Math.min(Math.ceil(filteredTransactions.length / itemsPerPage), prev + 1)
                )}
                disabled={currentPage === Math.ceil(filteredTransactions.length / itemsPerPage)}
              >
                Next
              </Button>
            </div>
          </div>

          {/* Dialogs */}
          <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Transaction Details</DialogTitle>
              </DialogHeader>
              {selectedTransaction && (
                <div className="space-y-4">
                  <div>
                    <label className="font-semibold">Order ID</label>
                    <p>#{selectedTransaction.orderId}</p>
                  </div>
                  <div>
                    <label className="font-semibold">User</label>
                    <p>{selectedTransaction.userName}</p>
                  </div>
                  <div>
                    <label className="font-semibold">Amount</label>
                    <p>${selectedTransaction.amount.toFixed(2)}</p>
                  </div>
                  <div>
                    <label className="font-semibold">Payment Method</label>
                    <p>{selectedTransaction.paymentMethod}</p>
                  </div>
                  <div>
                    <label className="font-semibold">Status</label>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(selectedTransaction.status)}
                      <span className="capitalize">{selectedTransaction.status}</span>
                    </div>
                  </div>
                  <div>
                    <label className="font-semibold">Created At</label>
                    <p>{format(selectedTransaction.createdAt, "PPp")}</p>
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

          <Dialog open={isRefundDialogOpen} onOpenChange={setIsRefundDialogOpen}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Process Refund</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleRefund} className="space-y-4">
                <div className="space-y-2">
                  <label>Transaction ID</label>
                  <Input
                    value={`#${refundData.transactionId}`}
                    disabled
                  />
                </div>

                <div className="space-y-2">
                  <label>Refund Amount</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={refundData.amount}
                    onChange={(e) => setRefundData({ 
                      ...refundData, 
                      amount: parseFloat(e.target.value) 
                    })}
                    max={selectedTransaction?.amount}
                  />
                  {errors.amount && (
                    <p className="text-sm text-red-500">{errors.amount}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label>Reason for Refund</label>
                  <Textarea
                    value={refundData.reason}
                    onChange={(e) => setRefundData({ 
                      ...refundData, 
                      reason: e.target.value 
                    })}
                    placeholder="Enter reason for refund"
                    rows={4}
                  />
                  {errors.reason && (
                    <p className="text-sm text-red-500">{errors.reason}</p>
                  )}
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsRefundDialogOpen(false);
                      resetRefundForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    Process Refund
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

        </motion.div>
      </Card>
    </div>
  );
};

export default Transactions;
