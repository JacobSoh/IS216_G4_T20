'use client'
import React from "react";

/**
 * FlowStep
 * - Displays one step in the "How It Works" section.
 * - Each step includes an icon, label, and description.
 * - It animates into view when it becomes visible in the viewport.
 */
const FlowStep = ({ icon, label, description, side = "left", visible }) => {
  return (
    <div className="min-h-[40vh] flex items-center relative">
      <div className="w-full px-6">
        <div className={`flex items-center ${side === 'right' ? 'justify-end' : 'justify-start'}`}>
          <div
            className={`max-w-md transform transition-all duration-700 ease-out ${
              visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-12 scale-90'
            }`}
          >
            <div className="flex flex-col items-center text-center">
              <div
                className={`text-gray-700 mb-4 transform transition-all duration-700 ${
                  visible ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-50 rotate-45'
                }`}
              >
                {icon}
              </div>
              <h3
                className={`text-xl font-semibold text-gray-800 mb-2 transition-all duration-700 ${
                  visible ? 'opacity-100' : 'opacity-0'
                }`}
              >
                {label}
              </h3>
              <p
                className={`text-gray-600 transition-all duration-700 ${
                  visible ? 'opacity-100' : 'opacity-0'
                }`}
              >
                {description}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlowStep;
