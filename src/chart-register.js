/**
 * This file explicitly registers all Chart.js components to prevent the
 * "line is not a registered controller" error in production builds.
 * 
 * Include this file in your main.js or App.vue to ensure all Chart.js
 * components are properly registered.
 */

import { 
  Chart, 
  LineController, 
  LineElement, 
  PointElement, 
  LinearScale, 
  CategoryScale,
  BarController,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Colors
} from 'chart.js';

// Register all components explicitly
export function registerChartComponents() {
  console.debug('Registering all Chart.js components');
  
  Chart.register(
    // Controllers
    LineController,
    BarController,
    
    // Elements
    LineElement,
    PointElement,
    BarElement,
    
    // Scales
    LinearScale,
    CategoryScale,
    
    // Plugins
    Title,
    Tooltip,
    Legend,
    Colors
  );
  
  console.debug('Chart.js components registered successfully');
  
  return Chart;
}

// Auto-register if imported directly
registerChartComponents();