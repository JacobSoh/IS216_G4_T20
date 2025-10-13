import LineChart from './line';

export const ChartTypes = {
    SimpleLineChart: 1,
    DashedLineChart: 2,
};

export default function ChartSelector (type) {
    switch (type) {
        case ChartTypes.SimpleLineChart:
            return LineChart.SimpleLineChart
        case ChartTypes.DashedLineChart:
            return LineChart.DashedLineChart
        default: return LineChart.SimpleLineChart
    };
};