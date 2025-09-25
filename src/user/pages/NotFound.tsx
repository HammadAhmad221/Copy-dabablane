import { Link } from 'react-router-dom';
import { Box, Typography, Button, Container } from '@mui/material';

const NotFound = () => {
  return (
    <Container maxWidth="md">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '80vh',
          textAlign: 'center',
          gap: 3
        }}
      >
        <Typography variant="h1" component="h1" sx={{ fontSize: '6rem', fontWeight: 'bold', color: '#197874' }}>
          404
        </Typography>
        <Typography variant="h4" component="h2" sx={{ mb: 2 }}>
          Page Not Found
        </Typography>
        <Typography variant="body1" sx={{ mb: 4, maxWidth: '600px' }}>
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </Typography>
        <Button
          component={Link}
          to="/"
          variant="contained"
          size="large"
          sx={{ 
            px: 4, 
            py: 1.5,
            bgcolor: '#197874',
            '&:hover': {
              bgcolor: '#156661'
            }
          }}
        >
          Go to Homepage
        </Button>
      </Box>
    </Container>
  );
};

export default NotFound; 