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

  // Customer names cache
  const [customerNames, setCustomerNames] = useState<Record<number, string>>({});

  // Search filter
  const [searchQuery, setSearchQuery] = useState<string>('');

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

  // Fetch customer names for items that don't have them
  const fetchCustomerNames = async (items: ReservationOrderItem[]) => {
    const customerIds = items
      .filter(item => !item.customer_name || item.customer_name.startsWith('Customer #'))
      .map(item => item.customers_id)
      .filter((id): id is number => id !== undefined && id !== null);

    if (customerIds.length === 0) return items;

    const uniqueIds = [...new Set(customerIds)];
    const newCustomerNames: Record<number, string> = { ...customerNames };

    // Fetch customer data for IDs we don't have yet
    const idsToFetch = uniqueIds.filter(id => !customerNames[id]);
    
    if (idsToFetch.length > 0) {
      console.log('🔍 Fetching customer names for IDs:', idsToFetch);
      
      // Note: You'll need to implement a customer API endpoint
      // For now, we'll try to use the phone number as the name
      // If you have a customer API, uncomment and use it:
      /*
      await Promise.all(
        idsToFetch.map(async (customerId) => {
          try {
            const customerData = await customerApi.getCustomerById(customerId);
            newCustomerNames[customerId] = customerData.name || customerData.first_name || `Customer #${customerId}`;
          } catch (error) {
            console.error(`Failed to fetch customer ${customerId}:`, error);
            newCustomerNames[customerId] = `Customer #${customerId}`;
          }
        })
      );
      */
    }

    setCustomerNames(newCustomerNames);

    // Update items with fetched customer names
    return items.map(item => {
      if (item.customers_id && newCustomerNames[item.customers_id]) {
        return {
          ...item,
          customer_name: newCustomerNames[item.customers_id],
        };
      }
      return item;
    });
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

      // Debug: Log the API response to see what fields are available
      console.log('✅ API Response received:', response);
      console.log('📊 Response structure:', {
        past_reservations: response.past_reservations?.length || 0,
        current_reservations: response.current_reservations?.length || 0,
        future_reservations: response.future_reservations?.length || 0,
        past_orders: response.past_orders?.length || 0,
        current_orders: response.current_orders?.length || 0,
        future_orders: response.future_orders?.length || 0,
      });
      console.log('🔍 Selected time period:', timePeriod);
      const sampleItem = response.past_reservations?.[0] || 
        response.current_reservations?.[0] || 
        response.future_reservations?.[0] ||
        response.past_orders?.[0] ||
        response.current_orders?.[0] ||
        response.future_orders?.[0];
      
      console.log('📝 Sample item from response:', sampleItem);
      console.log('👤 Customer data in sample:', {
        customer_name: sampleItem?.customer_name,
        customer: sampleItem?.customer,
        user: sampleItem?.user,
        customers_id: sampleItem?.customers_id,
        phone: sampleItem?.phone,
      });

      // Combine the appropriate arrays based on time period
      let combinedItems: ReservationOrderItem[] = [];
      
      // Helper function to normalize item data
      const normalizeItem = (item: any, type: 'reservation' | 'order') => {
        // Try to get customer name from various possible fields
        let customerName = item.customer_name || 
                          item.customer?.name || 
                          item.customer?.first_name || 
                          item.user?.name ||
                          item.user?.first_name;
        
        // If no name found, try to construct from first_name and last_name
        if (!customerName && (item.customer?.first_name || item.customer?.last_name)) {
          customerName = `${item.customer?.first_name || ''} ${item.customer?.last_name || ''}`.trim();
        }
        
        if (!customerName && (item.user?.first_name || item.user?.last_name)) {
          customerName = `${item.user?.first_name || ''} ${item.user?.last_name || ''}`.trim();
        }
        
        // If still no name, use phone number or email as fallback
        if (!customerName) {
          customerName = item.customer_email || 
                        item.customer?.email || 
                        item.phone || 
                        item.customer_phone || 
                        item.customer?.phone ||
                        `Customer #${item.customers_id || item.customer_id || ''}`;
        }
        
        return {
          ...item,
          type,
          // Normalize date fields
          created_at: item.created_at || item.date || item.order_date || item.reservation_date,
          start_date: item.start_date || item.date,
          // Normalize amount fields
          total_amount: item.total_amount || item.total_price || item.price,
          // Normalize payment fields
          payment_status: item.payment_status || item.payment_method || (item.is_paid ? 'paid' : 'pending'),
          // Normalize customer fields
          customer_name: customerName,
          customer_email: item.customer_email || item.customer?.email || item.user?.email,
          customer_phone: item.customer_phone || item.phone || item.customer?.phone || item.user?.phone,
          customers_id: item.customers_id || item.customer_id || item.customer?.id || item.user?.id,
          // Normalize blane fields
          blane_name: item.blane_name || item.blane?.name || item.blane?.title,
          // Normalize number fields
          reservation_number: item.reservation_number || item.NUM_RES || `RES-${item.id}`,
          order_number: item.order_number || item.NUM_ORDER || `ORD-${item.id}`,
        };
      };

      if (timePeriod === 'past') {
        const pastReservations = (response.past_reservations || []).map(item => normalizeItem(item, 'reservation'));
        const pastOrders = (response.past_orders || []).map(item => normalizeItem(item, 'order'));
        combinedItems = [...pastReservations, ...pastOrders];
        console.log(`📦 Past items combined: ${pastReservations.length} reservations + ${pastOrders.length} orders = ${combinedItems.length} total`);
      } else if (timePeriod === 'present') {
        const currentReservations = (response.current_reservations || []).map(item => normalizeItem(item, 'reservation'));
        const currentOrders = (response.current_orders || []).map(item => normalizeItem(item, 'order'));
        combinedItems = [...currentReservations, ...currentOrders];
        console.log(`📦 Current items combined: ${currentReservations.length} reservations + ${currentOrders.length} orders = ${combinedItems.length} total`);
      } else if (timePeriod === 'future') {
        const futureReservations = (response.future_reservations || []).map(item => normalizeItem(item, 'reservation'));
        const futureOrders = (response.future_orders || []).map(item => normalizeItem(item, 'order'));
        combinedItems = [...futureReservations, ...futureOrders];
        console.log(`📦 Future items combined: ${futureReservations.length} reservations + ${futureOrders.length} orders = ${combinedItems.length} total`);
      }

      setReservationOrders(combinedItems);
      setTotalCount(combinedItems.length);
      setDataLoaded(true);
      setPage(0); // Reset to first page

      // Calculate statistics from the actual displayed items
      const ordersCount = combinedItems.filter(item => item.type === 'order').length;
      const reservationsCount = combinedItems.filter(item => item.type === 'reservation').length;
      const totalAmount = combinedItems.reduce((sum, item) => {
        const amount = getItemAmount(item);
        console.log('Item amount:', {
          id: item.id,
          total_amount: item.total_amount,
          total_price: item.total_price,
          price: item.price,
          calculated: amount,
        });
        return sum + amount;
      }, 0);

      console.log('💰 Calculated stats:', {
        totalOrders: ordersCount,
        totalReservations: reservationsCount,
        totalAmount: totalAmount,
        itemsCount: combinedItems.length,
        isNaN: isNaN(totalAmount),
      });

      setStats({
        totalOrders: ordersCount,
        totalReservations: reservationsCount,
        totalAmount: totalAmount,
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
    const amount = item.total_amount || item.total_price || item.price || 0;
    // Convert to number if it's a string
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    // Return 0 if parsing failed (NaN)
    return isNaN(numAmount) ? 0 : numAmount;
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
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'MAD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
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

  // Filter data based on search query
  const filteredData = reservationOrders.filter((item) => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase().trim();
    
    // Normalize and clean text for comparison
    const normalizeText = (text: string | undefined | null): string => {
      if (!text) return '';
      return text.toString().toLowerCase().trim();
    };
    
    // Get all possible customer name variations
    const customerName = normalizeText(item.customer_name);
    const customerFirstName = normalizeText((item as any).customer?.first_name);
    const customerLastName = normalizeText((item as any).customer?.last_name);
    const customerFullName = `${customerFirstName} ${customerLastName}`.trim();
    const userName = normalizeText((item as any).user?.name);
    const userFirstName = normalizeText((item as any).user?.first_name);
    const userLastName = normalizeText((item as any).user?.last_name);
    const userFullName = `${userFirstName} ${userLastName}`.trim();
    
    // Get other searchable fields
    const customerEmail = normalizeText(item.customer_email);
    const customerPhone = normalizeText(item.customer_phone);
    const reservationNumber = normalizeText(item.reservation_number);
    const orderNumber = normalizeText(item.order_number);
    const blaneName = normalizeText(item.blane_name);
    const customerId = normalizeText(item.customers_id?.toString());
    
    // Check if query matches any field
    return (
      customerName.includes(query) ||
      customerFirstName.includes(query) ||
      customerLastName.includes(query) ||
      customerFullName.includes(query) ||
      userName.includes(query) ||
      userFirstName.includes(query) ||
      userLastName.includes(query) ||
      userFullName.includes(query) ||
      customerEmail.includes(query) ||
      customerPhone.includes(query) ||
      reservationNumber.includes(query) ||
      orderNumber.includes(query) ||
      blaneName.includes(query) ||
      customerId.includes(query)
    );
  });

  // Paginate the filtered data
  const paginatedData = filteredData.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Reset to first page when search query changes
  useEffect(() => {
    setPage(0);
  }, [searchQuery]);

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
              <MenuItem value="past">Past Reservation</MenuItem>
              <MenuItem value="present">Order</MenuItem>
              <MenuItem value="future">Future Reservation</MenuItem>
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

      {/* Search Filter */}
      {dataLoaded && reservationOrders.length > 0 && (
        <Paper sx={{ p: { xs: 2, sm: 2.5, md: 3 }, mb: { xs: 2, md: 3 } }}>
          <TextField
            fullWidth
            placeholder="Search by customer name, email, phone, or reservation number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <SearchIcon sx={{ color: '#00897B', mr: 1 }} />
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': {
                  borderColor: '#00897B',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#00897B',
                },
              },
            }}
          />
        </Paper>
      )}

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
                        {(() => {
                          // Check all possible payment status fields
                          const paymentStatus = 
                            item.payment_status || 
                            (item as any).paymentStatus || 
                            (item as any).payment_state ||
                            (item as any).payment_method ||
                            ((item as any).is_paid === 1 || (item as any).is_paid === true ? 'paid' : null) ||
                            ((item as any).is_paid === 0 || (item as any).is_paid === false ? 'pending' : null);
                          
                          const displayStatus = paymentStatus || 'Pending';
                          const isPaid = displayStatus?.toLowerCase() === 'paid' || displayStatus?.toLowerCase() === 'completed' || displayStatus?.toLowerCase() === 'success';
                          const isPending = displayStatus?.toLowerCase() === 'pending' || displayStatus?.toLowerCase() === 'unpaid';
                          
                          return (
                            <Chip
                              label={displayStatus}
                              color={
                                isPaid ? 'success' : isPending ? 'warning' : 'default'
                              }
                              size="small"
                              variant="outlined"
                              sx={{ textTransform: 'capitalize' }}
                            />
                          );
                        })()}
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
                  Page {page + 1} of {Math.ceil(filteredData.length / rowsPerPage)}
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => handleChangePage(null, page + 1)}
                  disabled={page >= Math.ceil(filteredData.length / rowsPerPage) - 1}
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
                          {(() => {
                            // Check all possible payment status fields
                            const paymentStatus = 
                              item.payment_status || 
                              (item as any).paymentStatus || 
                              (item as any).payment_state ||
                              (item as any).payment_method ||
                              ((item as any).is_paid === 1 || (item as any).is_paid === true ? 'paid' : null) ||
                              ((item as any).is_paid === 0 || (item as any).is_paid === false ? 'pending' : null);
                            
                            const displayStatus = paymentStatus || 'Pending';
                            const isPaid = displayStatus?.toLowerCase() === 'paid' || displayStatus?.toLowerCase() === 'completed' || displayStatus?.toLowerCase() === 'success';
                            const isPending = displayStatus?.toLowerCase() === 'pending' || displayStatus?.toLowerCase() === 'unpaid';
                            
                            return (
                              <Chip
                                label={displayStatus}
                                color={
                                  isPaid ? 'success' : isPending ? 'warning' : 'default'
                                }
                                size="small"
                                variant="outlined"
                                sx={{ textTransform: 'capitalize' }}
                              />
                            );
                          })()}
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
                count={filteredData.length}
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

