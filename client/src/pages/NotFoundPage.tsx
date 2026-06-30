import React from 'react';
import { Link } from 'react-router-dom';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4 animate-scale-in">
      <h1 className="text-7xl md:text-9xl font-black gradient-text mb-4">404</h1>
      <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Page not found</h2>
      <p className="text-slate-400 max-w-md mx-auto mb-8">
        The case you're looking for doesn't exist in our system, or you don't have the necessary clearance to view it.
      </p>
      <Link to="/" className="btn-primary">
        Back to Home
      </Link>
    </div>
  );
};
