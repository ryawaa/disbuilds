"use client";

import { useState } from 'react';

const platforms = ['Linux', 'macOS', 'Windows'];

export default function BuildList() {
  const [activeTab, setActiveTab] = useState('Windows');

  const placeholderBuilds = [
    { version: '1.0.0', date: '2023-05-01' },
    { version: '0.9.9', date: '2023-04-15' },
    { version: '0.9.8', date: '2023-04-01' },
  ];

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="flex border-b">
        {platforms.map((platform) => (
          <button
            key={platform}
            className={`flex-1 py-2 px-4 text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 ${
              activeTab === platform ? 'bg-gray-100' : ''
            }`}
            onClick={() => setActiveTab(platform)}
          >
            {platform}
          </button>
        ))}
      </div>
      <div className="p-4">
        <h2 className="text-xl font-semibold mb-4">{activeTab} Builds</h2>
        <ul className="space-y-2">
          {placeholderBuilds.map((build) => (
            <li key={build.version} className="flex justify-between items-center border-b pb-2">
              <span className="font-medium">Version {build.version}</span>
              <span className="text-gray-500">{build.date}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
