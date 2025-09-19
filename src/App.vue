<script setup>
import { ref, computed, onMounted } from 'vue'
import SummaryChart from './components/SummaryChart/Chart.vue'
import CategoriesChart from './components/CategoriesChart/Chart.vue'
import CompareChart from './components/CompareChart/Chart.vue'
import FlowChart from './components/FlowChart/Chart.vue'
import { useChartStore } from './store/chartStore'

const store = useChartStore();

const accounts = computed(() => Object.values(store.accounts).filter((account) => !account.archive))
const selectedAccountId = ref(null)

const onAccountChange = () => {
  store.setResultAccount(selectedAccountId.value);
}
onMounted(async () => {
  await store.fetchData();
  selectedAccountId.value = store.resultAcount
});

</script>

<template>
  <div class="app-container">
    <div class="row">
      <div class="controls">
        <select v-model="selectedAccountId" @change="onAccountChange">
          <option v-for="account in accounts" :key="account.id" :value="account.id">
            {{ account.title }}
          </option>
        </select>
      </div>
    </div>
    <div class="row">
      <div class="column">
        <CategoriesChart id="month" v-if="store.isLoaded" :chartData="store.monthChartData" :storeOptions="store.monthChartOptions" />
      </div>
      <div class="column">
        <CompareChart id="month" v-if="store.isLoaded" :chartData="store.compareChartData" :storeOptions="store.compareChartOptions" />
      </div>
    </div>
    <div class="row">
      <div class="column">
        <SummaryChart v-if="store.isLoaded" :chartData="store.summaryChartData" />
      </div>
    </div>
    <div class="row">
      <div class="column">
        <CategoriesChart id="year" v-if="store.isLoaded" :chartData="store.yearChartData" :storeOptions="store.yearChartOptions" />
      </div>
      <div class="column">
        <CategoriesChart id="month" v-if="store.isLoaded" :chartData="store.accountChartData" :storeOptions="store.accountChartOptions" />
      </div>
    </div>
    <div class="row">
      <div class="column">
        <FlowChart v-if="store.isLoaded" :chartData="store.flowChartData" :storeOptions="store.flowChartOptions" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.app-container {
  display: grid;
  grid-template-rows: repeat(auto-fit, auto);
  gap: 1rem;
  padding: 1rem;
}

.row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.row:first-child {
  grid-template-columns: 1fr;
}

.row:nth-child(3) {
  grid-template-columns: 1fr;
}
.row:nth-child(5) {
  grid-template-columns: 1fr;
}

.controls {
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.column {
  /* Optional: add padding or border for clarity */
  padding: 0.5rem;
}
.controls {
    padding: 10px;
}

@media (max-width: 768px) {
  .row {
    grid-template-columns: 1fr !important; /* Change all rows to single column on mobile */
    gap: 2rem; /* Increase the gap between items */
  }
  
  .column {
    min-height: 250px; /* Slightly smaller height on mobile */
  }
  
  .controls {
    flex-direction: column; /* Stack control elements vertically */
    align-items: flex-start;
  }
}
</style>
