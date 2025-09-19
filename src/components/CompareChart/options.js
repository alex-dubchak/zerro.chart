
import {
  Chart as ChartJS,
} from 'chart.js'

export const options = {
    options: {
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: {
            colors: {
                forceOverride: false
            },
            legend: {
                labels: {
                    // This generates the text that appears in the legend
                    generateLabels: function (chart) {
                        console.log("generateLabels called!");
                        // Get the default legend items
                        const original = ChartJS.defaults.plugins.legend.labels.generateLabels(chart);

                        // Create a new array with only unique labels
                        const uniqueLabels = [];
                        const seen = new Set();

                        original.forEach(item => {
                            const dataset = chart.data.datasets[item.datasetIndex];
                            if (!seen.has(dataset.label)) {
                                seen.add(dataset.label);
                                uniqueLabels.push(item);
                            }
                        });

                        return uniqueLabels;
                    }
                }
            },
            tooltip: {
                callbacks: {
                    // Use the displayName in tooltips instead of label
                    title: function (context) {
                        return context[0].dataset.displayName || context[0].dataset.label;
                    }
                }
            }
        },
        responsive: true,
        scales: {
            x: {
                stacked: false,
            },
            y: {
                stacked: true
            },
            x1: {
                stacked: false,
                position: 'top'
            }
        },
    },
    plugins: []
}