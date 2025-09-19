<template>
  <div v-if="!store.isLoaded">Loading...</div>
  <div v-else class="chart-container">
   <div class="controls-container">
      <div class="controls" v-if="storeOptions.period1Label">
        <button @click="storeOptions.period1++">&lt;</button>
        <span class="title">{{ storeOptions.period1Label }}</span>
        <button @click="storeOptions.period1--">&gt;</button>
      </div>
      <div class="controls" v-if="storeOptions.period2Label">
        <button @click="storeOptions.period2++">&lt;</button>
        <span class="title">{{ storeOptions.period2Label }}</span>
        <button @click="storeOptions.period2--">&gt;</button>
      </div>
    </div>
    <Bar id="comapre" :data="chartData" :options="chartOptions" :plugins="plugins" />
  </div>
</template>

<script setup>
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
} from 'chart.js'

import { reactive, defineProps } from 'vue';
import { options } from './options'
import { useChartStore } from '../../store/chartStore'

// Register Chart.js components
ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

const store = useChartStore();
const { storeOptions } = defineProps({
  chartData: Object,
  storeOptions: Object,
});

const chartOptions = reactive(options.options);
const plugins = reactive(options.plugins);

</script>

<style scoped>
.chart-container {
    width: 100%;
    height: 500px;
}
.controls-container {
    display: flex;
    justify-content: center;
    gap: 20px;
    margin-bottom: 10px;
}
.controls {
    display: flex;
    align-items: center;
}
.title {
    padding: 0 10px;
}
</style>