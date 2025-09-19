<script setup>
import { reactive, defineProps } from 'vue';
import { useChartStore } from '../../store/chartStore'
import { options } from './options'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  ArcElement,
} from 'chart.js';
import { Doughnut } from 'vue-chartjs';

ChartJS.register(Title, Tooltip, ArcElement);

const store = useChartStore();
const { storeOptions } = defineProps({
    chartData: Object,
    storeOptions: Object,
});
const chartOptions = reactive(options.options);
const plugins = reactive(options.plugins);

</script>
<template>
    <div v-if="!store.isLoaded">Loading...</div>
    <div v-else class="chart-container">
        <div class="controls" v-if="storeOptions.periodLabel">
            <button  @click="storeOptions.period++">🡰</button>
            <span class="title">{{ storeOptions.periodLabel }}</span>
            <button @click="storeOptions.period--">🡲</button>
        </div>
        <div class="filler" v-else></div>
        <Doughnut id="categories" :data="chartData" :options="chartOptions" :plugins="plugins" />
    </div>
</template>

<style scoped>
.chart-container {
    width: 100%;
    height: 500px;
}
.controls{
    text-align: center;
}
.title {
    padding: 0 10px;
}
.filler{
    height: 24px;
}
</style>