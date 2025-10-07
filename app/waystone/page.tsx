'use client';

export default function WaystonePage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Waystone Optimizer
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Optimize your waystone modifiers for maximum efficiency
          </p>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2">
            🚧 Coming Soon
          </h3>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            The Waystone Optimizer is currently being built. This feature will help you:
          </p>
          <ul className="mt-2 text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <li>• Optimize waystone modifiers for your build</li>
            <li>• Calculate expected rewards and difficulty</li>
            <li>• Find the best currency to use on waystones</li>
            <li>• Get strategies for maximum experience or loot</li>
          </ul>
        </div>
      </div>
    </div>
  );
}