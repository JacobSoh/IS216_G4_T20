// app/dashboard/page.jsx (or a component)
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import RGL, { WidthProvider } from 'react-grid-layout';

import DashboardPalette from '@/components/Charts/DashboardPalette';
import WidgetFrame from '@/components/Charts/WidgetFrame';

import { ChartTypes } from '@/components/Charts';
import { renderWidget } from '@/lib/widgets/registry';

// RGL wants CSS for its classes; import once in your app (e.g., in globals.css):
// @import 'react-grid-layout/css/styles.css';
// @import 'react-resizable/css/styles.css';

const ReactGridLayout = WidthProvider(RGL);

// sensible defaults
const COLS = 12;
const ROW_HEIGHT = 30;
const STORAGE_KEY = 'dashboard_layout_v1';

function loadState() {
    if (typeof window === 'undefined') return null;
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch { return null; }
}

function saveState(state) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { }
}

export default function DashboardPage() {
    const saved = loadState();
    const [layout, setLayout] = useState(saved?.layout ?? []);
    const [widgets, setWidgets] = useState(saved?.widgets ?? {});
    const [data, setData] = useState(saved?.data ?? {})

    // persist on change
    useEffect(() => {
        const clean = layout.filter(i => i.i !== '__dropping__');;
        if (clean.length !== layout.length) setLayout(clean);
        saveState({ layout, widgets });
    }, [layout, widgets]);

    const addWidget = useCallback((type, x = 0, y = 0) => {
        const id = crypto.randomUUID();
        const baseSize = type === ChartTypes.SimpleLineChart ? { w: 6, h: 8 } : { w: 4, h: 6 };
        setLayout((prev) => [...prev, { i: id, x, y, ...baseSize }]);
        setWidgets((prev) => ({
            ...prev,
            [id]: {
                id,
                type,
                props: {
                    // your initial props; you can later open a config panel
                    data: [
                        { name: 'A', uv: 4000, pv: 2400, amt: 2400 },
                        { name: 'B', uv: 3000, pv: 1398, amt: 2210 },
                        { name: 'C', uv: 2000, pv: 9800, amt: 2290 },
                        { name: 'D', uv: 2780, pv: 3908, amt: 2000 },
                    ],
                    toShow: [
                        { dataKey: 'pv', stroke: '#8884d8' },
                        { dataKey: 'uv', stroke: '#82ca9d', activeDot: { r: 8 } },
                    ],
                },
            },
        }));
    }, []);

    // RGL drop handler: called when a pill is dropped onto the grid
    const handleDrop = useCallback((layout, dropItem, e) => {
        const type = e.dataTransfer.getData('application/widget-type');
        if (!type) return;
        console.log(type);

        addWidget(type, dropItem.x, dropItem.y);
    }, [addWidget]);

    const removeWidget = useCallback((id) => {
        setLayout((prev) => prev.filter((l) => l.i !== id));
        setWidgets((prev) => {
            const copy = { ...prev };
            delete copy[id];
            return copy;
        });
    }, []);

    const onLayoutChange = useCallback((next) => setLayout(next.filter(item => item.i !== '__dropping__')), []);

    return (
        <div className="min-h-dvh bg-gray-950 text-white">
            <header className="p-4 border-b border-white/10">
                <h1 className="text-xl font-semibold">My Custom Dashboard</h1>
            </header>

            <DashboardPalette />

            <div className="p-4">
                <ReactGridLayout
                    className="layout"
                    cols={COLS}
                    rowHeight={ROW_HEIGHT}
                    isDroppable
                    isResizable
                    isDraggable
                    compactType="vertical"
                    margin={[12, 12]}
                    onDrop={handleDrop}
                    onLayoutChange={onLayoutChange}
                    // adding a placeholder drop item improves UX
                    droppingItem={{ i: '__dropping__', w: 4, h: 6 }}
                    layout={layout}
                >
                    {layout.map((l) => {
                        const w = widgets[l.i];
                        return (
                            <div key={l.i} className="bg-white/5 rounded-xl overflow-hidden">
                                <WidgetFrame title={w?.type ?? 'Widget'} onRemove={() => removeWidget(l.i)}>
                                    {/* RGL sets a concrete pixel height on this div; make child fill it */}
                                    <div className="w-full h-full">
                                        {w ? renderWidget(w) : null}
                                    </div>
                                </WidgetFrame>
                            </div>
                        );
                    })}
                </ReactGridLayout>
            </div>
        </div>
    );
};
