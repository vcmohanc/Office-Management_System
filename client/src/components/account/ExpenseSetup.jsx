import React, { useState } from 'react';

const REGIONS = [
  'Hokkaido',
  'Northern Tohoku',
  'Southern Tohoku',
  'Kanto',
  'Shinetsu',
  'Hokuriku',
  'Chubu',
  'Kansai',
  'Chugoku',
  'Shikoku',
  'Kyushu',
  'Okinawa'
];

// Initial dummy values based on the screenshot pattern
const getInitialCharges = () => {
  const matrix = {};
  REGIONS.forEach(departure => {
    matrix[departure] = {};
    REGIONS.forEach(destination => {
      // Default dummy value
      let val = '4,530';
      if (departure === destination) {
        val = 'なし';
      } else if (
        (departure === 'Okinawa' && destination !== 'Okinawa') || 
        (destination === 'Okinawa' && departure !== 'Okinawa')
      ) {
        val = '9,130'; // Just some dummy variability
      }
      matrix[departure][destination] = val;
    });
  });
  return matrix;
};

export default function ExpenseSetup() {
  const [activeTab, setActiveTab] = useState('postal');
  const [postalCharges, setPostalCharges] = useState(getInitialCharges());
  const [travelCharges, setTravelCharges] = useState(getInitialCharges());

  const currentCharges = activeTab === 'postal' ? postalCharges : travelCharges;

  const handleChargeChange = (departure, destination, value) => {
    if (activeTab === 'postal') {
      setPostalCharges(prev => ({
        ...prev,
        [departure]: {
          ...prev[departure],
          [destination]: value
        }
      }));
    } else {
      setTravelCharges(prev => ({
        ...prev,
        [departure]: {
          ...prev[departure],
          [destination]: value
        }
      }));
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#F8F9FA]">
      
      {/* Top Tabs */}
      <div className="flex space-x-2 mb-6">
        <button
          onClick={() => setActiveTab('postal')}
          className={`px-6 py-2 rounded-md font-medium transition-colors ${
            activeTab === 'postal' 
              ? 'bg-[#162D50] text-white' 
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          Postal Charges
        </button>
        <button
          onClick={() => setActiveTab('travel')}
          className={`px-6 py-2 rounded-md font-medium transition-colors ${
            activeTab === 'travel' 
              ? 'bg-[#162D50] text-white' 
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          Travel Expenses
        </button>
      </div>

      <div className="flex flex-col flex-1 bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-bold text-[#162D50]">
            {activeTab === 'postal' ? 'Postal Charges Setup' : 'Travel Expenses Setup'}
          </h2>
          <button className="px-4 py-2 bg-[#162D50] text-white rounded-md hover:bg-[#203c6b] transition-colors font-medium">
            Save Changes
          </button>
        </div>

        <div className="p-6 overflow-auto">
          <table className="w-full border-collapse min-w-max">
            <thead>
              <tr>
                <th className="p-3 border border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider sticky left-0 z-10 w-32">
                  DEPARTURE \ DEST.
                </th>
                {REGIONS.map(region => (
                  <th key={region} className="p-3 border border-gray-200 bg-gray-50 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider w-24">
                    {region}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {REGIONS.map((departure, rowIndex) => (
                <tr key={departure} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                  <td className="p-3 border border-gray-200 font-medium text-sm text-gray-700 bg-white sticky left-0 z-10 whitespace-nowrap">
                    {departure}
                  </td>
                  
                  {REGIONS.map((destination) => {
                    const isDiagonal = departure === destination;
                    const value = currentCharges[departure][destination];
                    
                    return (
                      <td 
                        key={`${departure}-${destination}`} 
                        className={`p-2 border border-gray-200 text-center ${isDiagonal ? 'bg-red-50' : 'bg-white'}`}
                      >
                        {isDiagonal ? (
                          <span className="text-red-500 font-bold text-sm">なし</span>
                        ) : (
                          <input
                            type="text"
                            value={value}
                            onChange={(e) => handleChargeChange(departure, destination, e.target.value)}
                            className="w-full text-center p-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
