import { Blane } from '../types/blane';
import { NewBlanes } from '../services/front/blaneService';

export let newBlanes: Blane[] = [];
let isInitialized = false;

export const initializeBlanes = async () => {
  if (isInitialized) return;
  
  try {
    const fetchedBlanes = await NewBlanes();
    newBlanes = [...fetchedBlanes];
    isInitialized = true;
  } catch (error) {
    return [];
  }
};

// Initialize the data when the module is imported
initializeBlanes();