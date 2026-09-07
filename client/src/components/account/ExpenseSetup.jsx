import React, { useState, useEffect } from 'react';

export default function ExpenseSetup() {
  const [activeTab, setActiveTab] = useState('postal');
  const [regions, setRegions] = useState([]);
  const [postalCharges, setPostalCharges] = useState({});
  const [travelCharges, setTravelCharges] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const regionsRes = await fetch(`${import.meta.env.VITE_API_URL}/api/regions`);
        if (regionsRes.ok) {
          const fetchedRegions = await regionsRes.json();
          setRegions(fetchedRegions);
        }

        const [postalRes, travelRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/api/expenses/postal`),
          fetch(`${import.meta.env.VITE_API_URL}/api/expenses/travel`)
        ]);
        
        if (postalRes.ok) {
          const postalData = await postalRes.json();
          setPostalCharges(postalData);
        }
        
        if (travelRes.ok) {
          const travelData = await travelRes.json();
          setTravelCharges(travelData);
        }
      } catch (err) {
        console.error("Failed to fetch charges:", err);
      }
    };
    fetchData();
  }, []);

  const handleSave = async () => {
    setIsLoading(true);
    const endpoint = activeTab === 'postal' ? '/api/expenses/postal' : '/api/expenses/travel';
    const payload = activeTab === 'postal' ? postalCharges : travelCharges;
    
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}${endpoint}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        alert(`${activeTab === 'postal' ? 'Postal' : 'Travel'} charges saved successfully!`);
      } else {
        alert('Failed to save changes.');
      }
    } catch (err) {
      console.error(err);
      alert('Error saving changes.');
    } finally {
      setIsLoading(false);
    }
  };

  const currentCharges = activeTab === 'postal' ? postalCharges : travelCharges;

  const handleChargeChange = (departureId, destinationId, value) => {
    if (activeTab === 'postal') {
      setPostalCharges(prev => ({
        ...prev,
        [departureId]: {
          ...(prev[departureId] || {}),
          [destinationId]: value
        }
      }));
    } else {
      setTravelCharges(prev => ({
        ...prev,
        [departureId]: {
          ...(prev[departureId] || {}),
          [destinationId]: value
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
          <button 
            onClick={handleSave}
            disabled={isLoading}
            className="px-4 py-2 bg-[#162D50] text-white rounded-md hover:bg-[#203c6b] transition-colors font-medium disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        <div className="p-6 overflow-auto">
          <table className="w-full border-collapse min-w-max">
            <thead>
              <tr>
                <th className="p-3 border border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider sticky left-0 z-10 w-32">
                  {activeTab === 'postal' ? 'Sender / Receiver' : 'Departure / Arrival'}
                </th>
                {regions.map(region => (
                  <th key={region._id} className="p-3 border border-gray-200 bg-gray-50 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider w-24">
                    {region.name1}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {regions.map((departure, rowIndex) => (
                <tr key={departure._id} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                  <td className="p-3 border border-gray-200 font-medium text-sm text-gray-700 bg-white sticky left-0 z-10 whitespace-nowrap">
                    {departure.name1}
                  </td>
                  
                  {regions.map((destination) => {
                    const isDiagonal = departure._id === destination._id;
                    const value = currentCharges[departure._id]?.[destination._id] || '';
                    
                    return (
                      <td 
                        key={`${departure._id}-${destination._id}`} 
                        className={`p-2 border border-gray-200 text-center ${isDiagonal ? 'bg-red-50' : 'bg-white'}`}
                      >
                        {isDiagonal ? (
                          <span className="text-red-500 font-bold text-sm">なし</span>
                        ) : (
                          <div className="flex items-center">
                            <span className="text-gray-500 mr-1">¥</span>
                            <input
                              type="text"
                              value={value}
                              onChange={(e) => handleChargeChange(departure._id, destination._id, e.target.value)}
                              className="w-full text-center p-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
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
