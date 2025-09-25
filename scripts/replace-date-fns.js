/**
 * This is a utility script that helps find all instances of date-fns in the project
 * and provides guidance on how to replace them with dayjs.
 * 
 * Usage:
 * 1. node scripts/replace-date-fns.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Map of date-fns functions to their dayjs equivalents
const functionMap = {
  'format': 'format - e.g., dayjs(date).format("YYYY-MM-DD")',
  'differenceInDays': 'diff - e.g., dayjs(date2).diff(dayjs(date1), "day")',
  'parseISO': 'no need, dayjs parses ISO strings automatically',
  'formatDistanceToNow': 'fromNow - e.g., dayjs(date).fromNow()',
  'isBefore': 'isBefore - e.g., dayjs(date1).isBefore(dayjs(date2))',
  'isAfter': 'isAfter - e.g., dayjs(date1).isAfter(dayjs(date2))',
  'addDays': 'add - e.g., dayjs(date).add(n, "day")',
  'subDays': 'subtract - e.g., dayjs(date).subtract(n, "day")',
  'startOfDay': 'startOf - e.g., dayjs(date).startOf("day")',
  'endOfDay': 'endOf - e.g., dayjs(date).endOf("day")',
  'setHours': 'use dayjs().hour(n).minute(n).second(n)',
  'isValid': 'isValid - e.g., dayjs(date).isValid()',
};

// Find all files with date-fns imports
try {
  const output = execSync('grep -r "from \'date-fns\'" --include="*.ts" --include="*.tsx" src').toString();
  const files = output.split('\n').filter(Boolean).map(line => {
    const [filePath] = line.split(':');
    return filePath;
  });
  
  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    
    // Extract the imported functions
    const importMatch = content.match(/import\s+\{\s+(.*?)\s+\}\s+from\s+['"]date-fns['"]/);
    if (importMatch && importMatch[1]) {
      const functions = importMatch[1].split(',').map(fn => fn.trim());
    }
  });

} catch (error) {
  console.error('Error finding files:', error.message);
} 