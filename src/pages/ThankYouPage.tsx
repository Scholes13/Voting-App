import React from 'react';

const ThankYouPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center text-blue-600 mb-4">Terima Kasih Telah Voting!</h2>
        <p className="text-gray-700 text-center">Suara Anda telah berhasil direkam.</p>
      </div>
    </div>
  );
};

export default ThankYouPage;