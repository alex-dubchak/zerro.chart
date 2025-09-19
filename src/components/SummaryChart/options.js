export const options = {
    options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: {
                stacked: true,
            },
            y: {
                stacked: true,
                position: 'right',
            },
            y1: {
                stacked: false
            }
        },
        plugins: {
            title: {
                display: false,
                text: 'Report'
            },
            colors: {
                forceOverride: true
            },
            legend: {
                labels: {
                }
            }
        },
    },
    plugins: [],
};