import React, { useState, useEffect, useCallback } from 'react';
import { useTheme, useMediaQuery } from '@mui/material';
import {
  Box,
  Paper,
  Typography,
  TextField,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  CircularProgress,
  Alert,
  Chip,
  Grid,
  Card,
  CardContent,
  Avatar,
  InputAdornment,
  Button,
} from '@mui/material';
import {
  Search as SearchIcon,
  CalendarToday as CalendarIcon,
  ShoppingCart as OrderIcon,
  EventNote as ReservationIcon,
} from '@mui/icons-material';
import { vendorApi } from '../../lib/api/services/vendorService';
import { vendorReservationOrderApi } from '../../lib/api/services/vendorReservationOrderService';
import { Vendor } from '../../lib/api/types/vendor';
import {
  ReservationOrderItem,
  TimePeriod,
} from '../../lib/api/types/vendorReservationOrder';
import { toast } from 'react-hot-toast';

const VendorReservationOrders: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // State management
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<string>('');
  const [timePeriod, setTimePeriod] = useState<TimePeriod | ''>('');
  const [reservationOrders, setReservationOrders] = useState<ReservationOrderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [vendorsLoading, setVendorsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalCount, setTotalCount] = useState(0);

  // Statistics
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalReservations: 0,
    totalAmount: 0,
  });

  // Fetch vendors on component mount
  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      setVendorsLoading(true);
      const response = await vendorApi.getVendors(undefined, 100, 1);
      setVendors(response.data || []);
    } catch (err: any) {
      console.error('Error fetching vendors:', err);
      toast.error('Failed to load vendors');
    } finally {
      setVendorsLoading(false);
    }
  };

  // Fetch reservation orders when vendor and time period are selected
  const fetchReservationOrders = async () => {
    if (!selectedVendor || !timePeriod) {
      toast.error('Please select both vendor and time period');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const selectedVendorData = vendors.find(
        (v) => v.id.toString() === selectedVendor
      );

      if (!selectedVendorData) {
        toast.error('Vendor not found');
        return;
      }

      const commerceName = selectedVendorData.company_name || selectedVendorData.name;

      const response = await vendorReservationOrderApi.getByVendorCommerceName(
        commerceName,
        timePeriod,
        100,
        1
      );

      // Combine the appropriate arrays based on time period
      let combinedItems: ReservationOrderItem[] = [];
      
      if (timePeriod === 'past') {
        const pastReservations = (response.past_reservations || []).map(item => ({ ...item, type: 'reservation' as const }));
        const pastOrders = (response.past_orders || []).map(item => ({ ...item, type: 'order' as const }));
        combinedItems = [...pastReservations, ...pastOrders];
      } else if (timePeriod === 'present') {
        const currentReservations = (response.current_reservations || []).map(item => ({ ...item, type: 'reservation' as const }));
        const currentOrders = (response.current_orders || []).map(item => ({ ...item, type: 'order' as const }));
        combinedItems = [...currentReservations, ...currentOrders];
      } else if (timePeriod === 'future') {
        const futureReservations = (response.future_reservations || []).map(item => ({ ...item, type: 'reservation' as const }));
        const futureOrders = (response.future_orders || []).map(item => ({ ...item, type: 'order' as const }));
        combinedItems = [...futureReservations, ...futureOrders];
      }

      setReservationOrders(combinedItems);
      setTotalCount(combinedItems.length);
      setDataLoaded(true);
      setPage(0); // Reset to first page

      // Use the statistics from the API
      setStats({
        totalOrders: response.total_orders || 0,
        totalReservations: response.total_reservations || 0,
        totalAmount: response.total_revenue || 0,
      });

      if (combinedItems.length === 0) {
        toast('No data found for the selected criteria', {
          icon: 'ℹ️',
        });
      } else {
        toast.success(`Loaded ${combinedItems.length} items successfully`);
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch reservation orders';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleVendorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedVendor(event.target.value);
    setReservationOrders([]);
    setDataLoaded(false);
    setError(null);
  };

  const handleTimePeriodChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTimePeriod(event.target.value as TimePeriod);
    setReservationOrders([]);
    setDataLoaded(false);
    setError(null);
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getItemAmount = (item: ReservationOrderItem): number => {
    return item.total_amount || item.total_price || item.price || 0;
  };

  const getItemNumber = (item: ReservationOrderItem): string => {
    if (item.type === 'order') {
      return item.order_number || `ORD-${item.order_id || item.id}`;
    }
    return item.reservation_number || `RES-${item.reservation_id || item.id}`;
  };

  const handleLoadData = () => {
    fetchReservationOrders();
  };

  const getStatusColor = (status: string) => {
    const statusColors: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
      completed: 'success',
      confirmed: 'success',
      pending: 'warning',
      cancelled: 'error',
      processing: 'info',
    };
    return statusColors[status.toLowerCase()] || 'default';
  };

  const getTypeIcon = (type: string) => {
    return type === 'order' ? <OrderIcon /> : <ReservationIcon />;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: 'MAD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Paginate the data on the client side
  const paginatedData = reservationOrders.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Box sx={{ p: { xs: 2, sm: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ mb: { xs: 2, md: 3 } }}>
        <Typography 
          variant="h4" 
          sx={{ 
            fontWeight: 600, 
            color: '#00897B', 
            mb: 1,
            fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' }
          }}
        >
          Vendor Reservations & Orders
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.875rem', md: '0.875rem' } }}>
          View and manage vendor reservations and orders across different time periods
        </Typography>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: { xs: 2, sm: 2.5, md: 3 }, mb: { xs: 2, md: 3 } }}>
        <Grid container spacing={{ xs: 2, sm: 2, md: 3 }} alignItems="stretch">
          <Grid item xs={12} sm={12} md={4}>
            <TextField
              select
              fullWidth
              label="Select Vendor"
              value={selectedVendor}
              onChange={handleVendorChange}
              disabled={vendorsLoading || loading}
              size="medium"
              InputProps={{
                startAdornment: vendorsLoading ? (
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                ) : null,
              }}
            >
              <MenuItem value="">
                <em>Select a vendor</em>
              </MenuItem>
              {vendors.map((vendor) => (
                <MenuItem key={vendor.id} value={vendor.id.toString()}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar
                      src={vendor.logoUrl || vendor.avatar || ''}
                      sx={{ width: 24, height: 24 }}
                    >
                      {vendor.name.charAt(0)}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {vendor.company_name || vendor.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
                        {vendor.email}
                      </Typography>
                    </Box>
                  </Box>
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={12} md={4}>
            <TextField
              select
              fullWidth
              label="Time Period"
              value={timePeriod}
              onChange={handleTimePeriodChange}
              disabled={!selectedVendor || loading}
              size="medium"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <CalendarIcon sx={{ color: '#00897B' }} />
                  </InputAdornment>
                ),
              }}
            >
              <MenuItem value="">
                <em>Select time period</em>
              </MenuItem>
              <MenuItem value="past">Past Orders/Reservations</MenuItem>
              <MenuItem value="present">Current/Active</MenuItem>
              <MenuItem value="future">Future Orders/Reservations</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12} sm={12} md={4}>
            <Button
              variant="contained"
              fullWidth
              onClick={handleLoadData}
              disabled={!selectedVendor || !timePeriod || loading}
              sx={{
                bgcolor: '#00897B',
                color: 'white',
                height: { xs: '48px', md: '56px' },
                fontSize: { xs: '0.875rem', md: '1rem' },
                '&:hover': {
                  bgcolor: '#00796B',
                },
                '&:disabled': {
                  bgcolor: '#cccccc',
                },
              }}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SearchIcon />}
            >
              {loading ? 'Loading...' : 'Load Data'}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Statistics Cards */}
      {dataLoaded && (
        <Grid container spacing={{ xs: 1.5, sm: 2, md: 2 }} sx={{ mb: { xs: 2, md: 3 } }}>
          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{ borderLeft: '4px solid #00897B', height: '100%' }}>
              <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, md: 2 } }}>
                  <OrderIcon sx={{ fontSize: { xs: 32, md: 40 }, color: '#00897B' }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 600, fontSize: { xs: '1.5rem', md: '2.125rem' } }}>
                      {stats.totalOrders}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                      Total Orders
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{ borderLeft: '4px solid #0097A7', height: '100%' }}>
              <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, md: 2 } }}>
                  <ReservationIcon sx={{ fontSize: { xs: 32, md: 40 }, color: '#0097A7' }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 600, fontSize: { xs: '1.5rem', md: '2.125rem' } }}>
                      {stats.totalReservations}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                      Total Reservations
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={12} md={4}>
            <Card sx={{ borderLeft: '4px solid #00796B', height: '100%' }}>
              <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, md: 2 } }}>
                  <Typography sx={{ fontSize: { xs: 32, md: 40 } }}>💰</Typography>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 600, fontSize: { xs: '1.25rem', md: '1.5rem' } }}>
                      {formatCurrency(stats.totalAmount)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                      Total Amount
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Info Message */}
      {!dataLoaded && !loading ? (
        <Paper sx={{ p: { xs: 3, md: 4 }, textAlign: 'center' }}>
          <CalendarIcon sx={{ fontSize: { xs: 48, md: 64 }, color: '#00897B', opacity: 0.3, mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}>
            Select a vendor and time period, then click "Load Data"
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.875rem', md: '0.875rem' } }}>
            Choose a vendor from the dropdown, select a time period, and click the "Load Data" button
            to display their reservations and orders
          </Typography>
        </Paper>
      ) : loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: { xs: 3, md: 4 } }}>
          <CircularProgress sx={{ color: '#00897B' }} />
        </Box>
      ) : reservationOrders.length === 0 ? (
        <Paper sx={{ p: { xs: 3, md: 4 }, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}>
            No data found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.875rem', md: '0.875rem' } }}>
            No reservations or orders found for the selected vendor and time period
          </Typography>
        </Paper>
      ) : (
        <>
          {/* Mobile Card View */}
          {isMobile ? (
            <Box>
              {paginatedData.map((item, index) => (
                <Card 
                  key={`${item.type}-${item.id}-${index}`}
                  sx={{ mb: 2, borderLeft: '4px solid #00897B' }}
                >
                  <CardContent sx={{ p: 2 }}>
                    {/* Header Row */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ fontSize: 20 }}>
                          {getTypeIcon(item.type || 'order')}
                        </Box>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600, textTransform: 'capitalize' }}>
                            {item.type || 'N/A'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                            {getItemNumber(item)}
                          </Typography>
                        </Box>
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: '#00897B' }}>
                        {formatCurrency(getItemAmount(item))}
                      </Typography>
                    </Box>

                    {/* Blane Name */}
                    {item.blane_name && (
                      <Box sx={{ mb: 1.5 }}>
                        <Typography variant="caption" color="text.secondary">Blane</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {item.blane_name}
                        </Typography>
                      </Box>
                    )}

                    {/* Customer Info */}
                    <Box sx={{ mb: 1.5 }}>
                      <Typography variant="caption" color="text.secondary">Customer</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {item.customer_name || `Customer #${item.customers_id || 'N/A'}`}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.customer_email || item.customer_phone || '-'}
                      </Typography>
                    </Box>

                    {/* Date */}
                    <Box sx={{ mb: 1.5 }}>
                      <Typography variant="caption" color="text.secondary">Date</Typography>
                      <Typography variant="body2">
                        {formatDate(item.created_at)}
                      </Typography>
                      {item.start_date && (
                        <Typography variant="caption" color="text.secondary">
                          Start: {formatDate(item.start_date)}
                        </Typography>
                      )}
                    </Box>

                    {/* Status & Payment Row */}
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                          Status
                        </Typography>
                        <Chip
                          label={item.status}
                          color={getStatusColor(item.status)}
                          size="small"
                          sx={{ textTransform: 'capitalize' }}
                        />
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                          Payment
                        </Typography>
                        <Chip
                          label={item.payment_status || 'N/A'}
                          color={
                            item.payment_status === 'paid'
                              ? 'success'
                              : item.payment_status === 'pending'
                              ? 'warning'
                              : 'default'
                          }
                          size="small"
                          variant="outlined"
                          sx={{ textTransform: 'capitalize' }}
                        />
                      </Box>
                      {item.quantity && item.quantity > 1 && (
                        <Box>
                          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                            Quantity
                          </Typography>
                          <Chip
                            label={`Qty: ${item.quantity}`}
                            size="small"
                            sx={{ bgcolor: '#f5f5f5' }}
                          />
                        </Box>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              ))}

              {/* Mobile Pagination */}
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, my: 2 }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => handleChangePage(null, Math.max(0, page - 1))}
                  disabled={page === 0}
                  sx={{ minWidth: '80px' }}
                >
                  Previous
                </Button>
                <Typography variant="body2">
                  Page {page + 1} of {Math.ceil(reservationOrders.length / rowsPerPage)}
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => handleChangePage(null, page + 1)}
                  disabled={page >= Math.ceil(reservationOrders.length / rowsPerPage) - 1}
                  sx={{ minWidth: '80px' }}
                >
                  Next
                </Button>
              </Box>

              {/* Rows per page selector */}
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1, mb: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Items per page:
                </Typography>
                <TextField
                  select
                  size="small"
                  value={rowsPerPage}
                  onChange={(e) => {
                    setRowsPerPage(parseInt(e.target.value, 10));
                    setPage(0);
                  }}
                  sx={{ minWidth: '80px' }}
                >
                  {[10, 25, 50, 100].map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
            </Box>
          ) : (
            /* Desktop Table View */
            <>
              <TableContainer 
                component={Paper} 
                sx={{ 
                  overflowX: 'auto',
                  mb: 0,
                  '&::-webkit-scrollbar': {
                    height: 8,
                  },
                  '&::-webkit-scrollbar-track': {
                    backgroundColor: '#f1f1f1',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    backgroundColor: '#00897B',
                    borderRadius: 4,
                  },
                }}
              >
                <Table sx={{ minWidth: 1000 }}>
                  <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', whiteSpace: 'nowrap' }}>Type</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', whiteSpace: 'nowrap' }}>Number</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', whiteSpace: 'nowrap' }}>Customer</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', whiteSpace: 'nowrap' }}>Date</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', whiteSpace: 'nowrap' }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', whiteSpace: 'nowrap' }}>Payment</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', whiteSpace: 'nowrap' }} align="right">
                        Amount
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedData.map((item, index) => (
                      <TableRow key={`${item.type}-${item.id}-${index}`} hover>
                        <TableCell sx={{ py: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Box sx={{ fontSize: 20 }}>
                              {getTypeIcon(item.type || 'order')}
                            </Box>
                            <Typography variant="body2" sx={{ textTransform: 'capitalize', fontSize: '0.875rem' }}>
                              {item.type || 'N/A'}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ py: 2 }}>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                            {getItemNumber(item)}
                          </Typography>
                          {item.blane_name && (
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.75rem' }}>
                              {item.blane_name}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell sx={{ py: 2 }}>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.875rem' }}>
                              {item.customer_name || `Customer #${item.customers_id || 'N/A'}`}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                              {item.customer_email || item.customer_phone || '-'}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ py: 2 }}>
                          <Typography variant="body2" sx={{ fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
                            {formatDate(item.created_at)}
                          </Typography>
                          {item.start_date && (
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                              Start: {formatDate(item.start_date)}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell sx={{ py: 2 }}>
                          <Chip
                            label={item.status}
                            color={getStatusColor(item.status)}
                            size="small"
                            sx={{ textTransform: 'capitalize' }}
                          />
                        </TableCell>
                        <TableCell sx={{ py: 2 }}>
                          <Chip
                            label={item.payment_status || 'N/A'}
                            color={
                              item.payment_status === 'paid'
                                ? 'success'
                                : item.payment_status === 'pending'
                                ? 'warning'
                                : 'default'
                            }
                            size="small"
                            variant="outlined"
                            sx={{ textTransform: 'capitalize' }}
                          />
                        </TableCell>
                        <TableCell align="right" sx={{ py: 2 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
                            {formatCurrency(getItemAmount(item))}
                          </Typography>
                          {item.quantity && item.quantity > 1 && (
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.75rem' }}>
                              Qty: {item.quantity}
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Desktop Pagination */}
              <TablePagination
                component="div"
                count={reservationOrders.length}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={[10, 25, 50, 100]}
              />
            </>
          )}
        </>
      )}
    </Box>
  );
};

export default VendorReservationOrders;

