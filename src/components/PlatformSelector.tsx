"use client";

import { useState } from 'react';

const platforms = ['Linux', 'macOS', 'Windows'];

export default function PlatformSelector() {
  const [selectedPlatform, setSelectedPlatform] = useState('Windows'); // Placeholder: default to Windows

  return (
    <div className="flex justify-center space-x-4">
      {platforms.map((platform) => (
        <button
          key={platform}
          className={`px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 ${
            selectedPlatform === platform
              ? 'bg-blue-500 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
          onClick={() => setSelectedPlatform(platform)}
        >
          {platform}
        </button>
      ))}
    </div>
  );
}
