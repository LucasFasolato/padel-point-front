import {
  Chart as ChartJS,
  RadarController,
  CategoryScale,
  LinearScale,
  RadialLinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  BarElement,
  ArcElement,
} from 'chart.js';

// Registrar todos los componentes que vas a usar
ChartJS.register(
  CategoryScale,
  LinearScale,
  RadialLinearScale,
  PointElement,
  LineElement,
  RadarController,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Defaults globales (opcional)
ChartJS.defaults.font.family = 'inherit';
ChartJS.defaults.color = '#64748b'; // slate-500
