import React from 'react';

interface LoadingSkeletonProps {
  rows?: number;
  columns?: number;
  message?: string;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  message = 'Loading operational data...',
}) => {
  return (
    <div className="subtle-loading-wrapper">
      <div className="subtle-loading-spinner" />
      <span className="subtle-loading-text">{message}</span>
    </div>
  );
};
