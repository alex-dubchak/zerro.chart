<template>
    <div v-if="!store.isLoaded">Loading...</div>
    <div v-else class="chart-container">
        <div class="controls">
            Display: <input type="number" v-model="store.summaryChartOptions.period" class="period" /> months
        </div>
        <Bar id="summary" :options="chartOptions" :data="chartData" :plugins="plugins" />
    </div>
</template>

<script setup>
import { reactive, defineProps } from 'vue';
import { Bar } from 'vue-chartjs'
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, LineElement, PointElement, CategoryScale, LinearScale, Colors } from 'chart.js'
import { useChartStore } from '../../store/chartStore'

import { options } from './options'

ChartJS.register(Title, Tooltip, Legend, BarElement, LineElement, PointElement, CategoryScale, LinearScale, Colors)
const store = useChartStore();

options.options.plugins.legend.onClick = (e, legendItem, legend) => {
    const index = legendItem.datasetIndex
    const chart = legend.chart
    const dataset = chart.data.datasets[index]

    const hc = store.summaryChartOptions.hiddenCategories;
    if (hc.includes(dataset.tag)) {
        store.summaryChartOptions.hiddenCategories = hc.filter((tag) => tag !== dataset.tag)
    } else {
        hc.push(dataset.tag)
    }
};

options.options.plugins.legend.labels.generateLabels = function (chart) {
    const defaultLabels = ChartJS.defaults.plugins.legend.labels.generateLabels(chart);
    return defaultLabels.map(label => {
        const dataset = chart.data.datasets[label.datasetIndex];
        if (dataset.tag && store.summaryChartOptions.hiddenCategories.includes(dataset.tag)) {
            label.hidden = true;
        }
        return label;
    });
};

defineProps({
  chartData: Object,
});
const chartOptions = reactive(options.options);
const plugins = reactive(options.plugins);


</script>
<style scoped>
.chart-container {
    width: 100%;
    height: 800px;
}

.period {
    width: 40px;
    margin-left: 10px;
}
</style>