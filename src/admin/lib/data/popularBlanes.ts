import { Blane } from '../types/blane';
import { PopularBlanes } from '../services/front/blaneService';

export let popularBlanes: Blane[] = []

// Function to initialize the data
export const initializeBlanes = async () => {
  try {
    const fetchedBlanes = await PopularBlanes();
    popularBlanes = [
    ]
    // Add fetched data to newBlanes
    popularBlanes = [...fetchedBlanes];    
  } catch (error) {
  }
};
// Initialize the data when the module is imported
initializeBlanes();