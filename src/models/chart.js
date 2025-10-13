import {
    ChartTypes
} from '@/components/Charts';

export default class Chart {
    data;
    toShow;
    constructor(data, toShow) {
        this.data = data??[];
        this.toShow = toShow??[];
    };

    LineChart = ({ type, toShow, cssHeight }) => {
        const LineChart = LineChartSelector(type);
        return (
            <div className={`h-${cssHeight}`}>
                <LineChart
                    data={this?.data}
                    toShow={this?.toShow}
                />
            </div>
        );
    };
}