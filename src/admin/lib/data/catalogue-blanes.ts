import { Blane } from '../types/blane';
import { defaultParams, getBlanes } from '../services/front/blaneService';

export let catalogueBlanes: Blane[] = []


// Function to initialize the data
export const initializeBlanes = async () => {
  try {
    const fetchedBlanes = await getBlanes(defaultParams);
 
    catalogueBlanes = [...fetchedBlanes];  
  } catch (error) {
  }
};

initializeBlanes();
