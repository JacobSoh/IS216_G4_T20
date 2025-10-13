// lib/widgets/registry.js
'use client';

import ChartSelector from '@/components/Charts';

// Provide a default renderer given a widget "type"
export function renderWidget(widget) {
    const Chart = ChartSelector(widget.type);
    return (
        <Chart data={widget.props.data} toShow={widget.props.toShow} />
    );
};
