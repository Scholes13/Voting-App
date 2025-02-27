import React from 'react';
import { Info } from 'lucide-react';

const DeploymentInfo = () => {
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white rounded-lg shadow-lg p-4 max-w-md">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <Info className="h-5 w-5 text-blue-500" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-gray-900">Netlify Deployment Information</h3>
            <div className="mt-2 text-sm text-gray-500">
              <p>When deployed to Netlify, access the admin login at:</p>
              <p className="mt-1 font-medium text-blue-600">[your-netlify-url]/login</p>
              <p className="mt-2">For example: <code>https://your-site-name.netlify.app/login</code></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeploymentInfo;