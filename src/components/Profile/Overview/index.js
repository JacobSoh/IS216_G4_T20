import React from 'react';
import CategoriesPie from './CategoriesPie';
import RevenueBar from './RevenueBar';

export default function Dashboard({ userId }) {
    return (
        <div className="w-full p-4 md:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pie Chart */}
                <div className="bg-white rounded-md shadow-lg p-6 border border-gray-200 flex justify-center items-center">
                    <CategoriesPie userId={userId}/>
                </div>

                {/* Bar Chart */}
                <div className="bg-white rounded-md shadow-lg p-6 border border-gray-200">
                    <RevenueBar userId={userId}/>
                </div>
            </div>
        </div>
    );
}
