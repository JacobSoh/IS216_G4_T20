import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export const SimpleLineChart = ({ 
    data=[], 
    toShow=[]
}) => {
    return (
        <ResponsiveContainer className='h-full w-full'>
            <LineChart
                data={data}
                className='p-1'
            >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                {toShow?.map(v => (
                        <Line 
                            type="monotone" 
                            key={`${v.dataKey}_SimpleLineChart`} 
                            dataKey={v.dataKey} 
                            stroke={v.stroke} 
                            activeDot={v.activeDot??null}
                        />
                    )
                )};
            </LineChart>
        </ResponsiveContainer>
    );
};

export const DashedLineChart = ({ 
    data=[], 
    toShow=[]
}) => {
    return (
        <ResponsiveContainer className='h-full w-full'>
            <LineChart
                data={data}
                className='p-1'
            >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                {toShow?.map(v => (
                        <Line 
                            type="monotone" 
                            key={`${v.dataKey}_SimpleLineChart`} 
                            dataKey={v.dataKey} 
                            stroke={v.stroke} 
                            activeDot={v.activeDot??null}
                            strokeDasharray={v.strokeDasharray??null}
                        />
                    )
                )};
            </LineChart>
        </ResponsiveContainer>
    );
};


export default {
    SimpleLineChart,
    DashedLineChart
}