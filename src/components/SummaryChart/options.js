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
            },
            tooltip: {
                callbacks: {
                    // Top transactions for the hovered element (category / income / expense)
                    afterBody(items) {
                        const lines = [];
                        for (const { dataset, dataIndex } of items) {
                            const details = dataset.details?.[dataIndex];
                            if (!details?.length) continue;
                            lines.push('', 'Top transactions:');
                            for (const { date, title, amount } of details) {
                                lines.push(`${date}  ${title}: ${amount.toFixed(2)}`);
                            }
                        }
                        return lines;
                    }
                }
            }
        },
    },
    plugins: [],
};