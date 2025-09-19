export const options = {
    options: {
        maintainAspectRatio: false,
        plugins: {
            title: {
                display: true,
                text: 'Month'
            },
            legend: {
                display: false
            }
        },
        responsive: true,
        plugins: {
            colors: {
                forceOverride: false
            }
        }
    },
    plugins: [{
        id: 'doughnutLabel',
        beforeDatasetsDraw(chart, args, pluginOptions) {
            const {
                ctx,
                data
            } = chart;
            if (!data.datasets.length) return;
            ctx.save();
            const x = chart.getDatasetMeta(0).data[0].x;
            const y = chart.getDatasetMeta(0).data[0].y;
            ctx.font = 'bold 25px sans-serif';
            ctx.fillStyle = 'rgba(54, 162, 235, 1)';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            const labelOutcome = data.datasets[0].expence?.toFixed(2);
            const labelIncome = data.datasets[0].income?.toFixed(2);

            const offset = labelOutcome ? 20 : 0;

            const symbol = data.datasets[0].instrument.symbol;
            ctx.fillText(`+${symbol}${labelIncome}`, x, y - offset);
            if (labelOutcome) {
                ctx.fillStyle = '#FF6384';
                ctx.fillText(`-${symbol}${labelOutcome}`, x, y + offset);
            }
        }
    }],
};