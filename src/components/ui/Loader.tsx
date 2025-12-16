import React from 'react';

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'white';
}

export const Loader: React.FC<LoaderProps> = ({
  size = 'md',
  color = 'primary'
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const colorClasses = {
    primary: 'border-primary-500',
    white: 'border-white'
  };

  return (
    <div
      className={`${sizeClasses[size]} border-2 border-t-transparent ${colorClasses[color]} rounded-full animate-spin`}
    />
  );
};

interface PageLoaderProps {
  message?: string;
}

export const PageLoader: React.FC<PageLoaderProps> = ({
  message = 'Carregando...'
}) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <Loader size="lg" />
      <p className="mt-4 text-gray-600">{message}</p>
    </div>
  );
};
