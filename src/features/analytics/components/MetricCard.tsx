import React from 'react';
import { clsx } from 'clsx';

interface MetricCardProps {
  title: string;
  value: number | string;
  unit?: string;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
  };
  loading?: boolean;
  error?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit,
  trend,
  loading,
  error
}) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded mb-2"></div>
        <div className="h-8 bg-gray-200 rounded mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-red-200 p-6">
        <h3 className="text-sm font-medium text-gray-900 mb-2">{title}</h3>
        <div className="text-red-600 text-sm">{error}</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900">{title}</h3>
        {trend && (
          <div className={clsx(
            'flex items-center text-sm',
            trend.direction === 'up' && 'text-green-600',
            trend.direction === 'down' && 'text-red-600',
            trend.direction === 'neutral' && 'text-gray-600'
          )}>
            <span className="mr-1">
              {trend.direction === 'up' && '↗️'}
              {trend.direction === 'down' && '↘️'}
              {trend.direction === 'neutral' && '→'}
            </span>
            {Math.abs(trend.value)}%
          </div>
        )}
      </div>
      
      <div className="mt-2">
        <div className="text-3xl font-bold text-gray-900">
          {typeof value === 'number' ? value.toLocaleString() : value}
          {unit && <span className="text-lg font-normal text-gray-500 ml-1">{unit}</span>}
        </div>
      </div>
    </div>
  );
};
