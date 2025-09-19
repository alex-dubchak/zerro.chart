export const options = {
    options: {
        maintainAspectRatio: false,
        plugins: {
            tooltip: {
                callbacks: {
                    title: (context) => {
                        const customLabels = context[0].dataset.labels;
                        const link = context[0].raw;
                        return `${customLabels[link.from] || link.from} → ${customLabels[link.to] || link.to}`;
                    },
                    label: (context) => {
                        const link = context.raw;
                        return `Value: ${link.flow.toFixed(2)}`;
                    }
                }
            },
            sankey: {
                node: {
                    sort: (a, b) => {
                        const aFlow = a.total;
                        const bFlow = b.total;
                        console.log(bFlow - aFlow)
                        return bFlow - aFlow; // Descending order
                    }
                }
            }
        }
    },
    plugins: [],
};