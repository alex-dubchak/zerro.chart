<script setup>
import {
    Chart as ChartJS,
    LinearScale
} from 'chart.js';
import { SankeyController, Flow } from 'chartjs-chart-sankey';
import { createTypedChart } from 'vue-chartjs';
import { useChartStore } from '../../store/chartStore'
import { reactive, defineProps } from 'vue';
import { options } from './options'

ChartJS.register(SankeyController, Flow, LinearScale);

const store = useChartStore();

const { storeOptions } = defineProps({
    chartData: Object,
    storeOptions: Object,
});

const chartOptions = reactive(options.options);
const plugins = reactive(options.plugins);

const SankeyChart = createTypedChart('sankey', SankeyController)

</script>

<template>
    <div v-if="!store.isLoaded">Loading...</div>
    <div v-else class="chart-container">
        <div class="controls" v-if="storeOptions.periodLabel">
            <button @click="storeOptions.period++">🡰</button>
            <span class="title">{{ storeOptions.periodLabel }}</span>
            <button @click="storeOptions.period--">🡲</button>
        </div>
        <div class="filler" v-else></div>
        <SankeyChart id="flow" :data="chartData" :options="chartOptions" :plugins="plugins" />
    </div>
</template>

<style scoped>
.chart-container{
    height: 800px;
    padding-bottom: 100px;
}
.controls{
    text-align: center;
}
@media (max-width: 768px) {
.chart-container{
    height: 600px!important;
}
}
</style>