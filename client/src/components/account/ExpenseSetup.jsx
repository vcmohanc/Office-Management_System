import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../utils/apiFetch.js';


export default function ExpenseSetup() {
  const [activeTab, setActiveTab] = useState('postal');
  const [regions, setRegions] = useState([]);
  const [postalCharges, setPostalCharges] = useState({});
  const [travelCharges, setTravelCharges] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // Region management states
  const [editingRegion, setEditingRegion] = useState(null);
  const [editName1, setEditName1] = useState('');
  const [editName2, setEditName2] = useState('');
  const [newName1, setNewName1] = useState('');
  const [newName2, setNewName2] = useState('');

  const fetchData = async () => {
    try {
      const regionsRes = await apiFetch('/api/regions');
      if (regionsRes.ok) {
        const fetchedRegions = await regionsRes.json();
        setRegions(fetchedRegions);
      }

      const [postalRes, travelRes] = await Promise.all([
        apiFetch('/api/expenses/postal'),
        apiFetch('/api/expenses/travel')
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

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async () => {
    setIsLoading(true);
    const endpoint = activeTab === 'postal' ? '/api/expenses/postal' : '/api/expenses/travel';
    const payload = activeTab === 'postal' ? postalCharges : travelCharges;
    
    try {
      const res = await apiFetch(endpoint, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      
      if (res.ok) {
        alert(`${activeTab === 'postal' ? 'Postal' : 'Travel'} charges saved successfully!`);
      } else {
        let errMsg = 'Failed to save changes.';
        try {
          const errData = await res.json();
          if (errData.message) errMsg = `Failed to save changes: ${errData.message}`;
        } catch (e) {
          errMsg = `Failed to save changes. Status: ${res.status}`;
        }
        alert(errMsg);
      }
    } catch (err) {
      console.error(err);
      alert(`Error saving changes: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

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

  const handleAddRegion = async () => {
    if (!newName1.trim() || !newName2.trim()) {
      alert('Please provide both Sender/Departure and Recipient/Arrival names.');
      return;
    }
    setIsLoading(true);
    try {
      const res = await apiFetch('/api/regions', {
        method: 'POST',
        body: JSON.stringify({ name1: newName1, name2: newName2 }),
      });
      if (res.ok) {
        setNewName1('');
        setNewName2('');
        fetchData();
      } else {
        alert('Failed to add region');
      }
    } catch (err) {
      console.error(err);
      alert('Error adding region');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateRegion = async (id) => {
    if (!editName1.trim() || !editName2.trim()) {
      alert('Please provide both Sender/Departure and Recipient/Arrival names.');
      return;
    }
    setIsLoading(true);
    try {
      const res = await apiFetch(`/api/regions/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ name1: editName1, name2: editName2 }),
      });
      if (res.ok) {
        setEditingRegion(null);
        fetchData();
      } else {
        alert('Failed to update region');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating region');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRegion = async (id) => {
    if (!window.confirm('Are you sure you want to delete this region? This will also remove any saved prices for this region.')) {
      return;
    }
    setIsLoading(true);
    try {
      const res = await apiFetch(`/api/regions/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchData();
      } else {
        alert('Failed to delete region');
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting region');
    } finally {
      setIsLoading(false);
    }
  };

  const currentCharges = activeTab === 'postal' ? postalCharges : travelCharges;

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
        <button
          onClick={() => setActiveTab('regions')}
          className={`px-6 py-2 rounded-md font-medium transition-colors ${
            activeTab === 'regions' 
              ? 'bg-[#162D50] text-white' 
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          Manage Regions
        </button>
      </div>

      <div className="flex flex-col flex-1 bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-bold text-[#162D50]">
            {activeTab === 'postal' && 'Postal Charges Setup'}
            {activeTab === 'travel' && 'Travel Expenses Setup'}
            {activeTab === 'regions' && 'Manage Regions'}
          </h2>
          {activeTab !== 'regions' && (
            <button 
              onClick={handleSave}
              disabled={isLoading}
              className="px-4 py-2 bg-[#162D50] text-white rounded-md hover:bg-[#203c6b] transition-colors font-medium disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          )}
        </div>

        <div className="p-6 overflow-auto">
          {activeTab === 'regions' ? (
            <div className="max-w-4xl">
              <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h3 className="font-semibold text-gray-700 mb-3">Add New Region</h3>
                <div className="flex gap-4 items-end">
                  <div className="flex-1">
                    <label className="block text-sm text-gray-600 mb-1">Sender / Departure Name (name1)</label>
                    <input 
                      type="text" 
                      value={newName1}
                      onChange={e => setNewName1(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="e.g. Hokkaido"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm text-gray-600 mb-1">Recipient / Arrival Name (name2)</label>
                    <input 
                      type="text" 
                      value={newName2}
                      onChange={e => setNewName2(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="e.g. Hokkaido"
                    />
                  </div>
                  <button 
                    onClick={handleAddRegion}
                    disabled={isLoading}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>

              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="p-3 border border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase">Sender / Departure (name1)</th>
                    <th className="p-3 border border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase">Recipient / Arrival (name2)</th>
                    <th className="p-3 border border-gray-200 bg-gray-50 text-center text-xs font-semibold text-gray-600 uppercase w-32">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {regions.map(region => (
                    <tr key={region._id} className="hover:bg-gray-50">
                      {editingRegion === region._id ? (
                        <>
                          <td className="p-3 border border-gray-200">
                            <input 
                              type="text" 
                              value={editName1}
                              onChange={e => setEditName1(e.target.value)}
                              className="w-full p-1.5 border border-gray-300 rounded"
                            />
                          </td>
                          <td className="p-3 border border-gray-200">
                            <input 
                              type="text" 
                              value={editName2}
                              onChange={e => setEditName2(e.target.value)}
                              className="w-full p-1.5 border border-gray-300 rounded"
                            />
                          </td>
                          <td className="p-3 border border-gray-200 text-center">
                            <button onClick={() => handleUpdateRegion(region._id)} className="text-blue-600 hover:text-blue-800 mr-3 font-medium">Save</button>
                            <button onClick={() => setEditingRegion(null)} className="text-gray-500 hover:text-gray-700 font-medium">Cancel</button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="p-3 border border-gray-200 text-sm text-gray-800">{region.name1}</td>
                          <td className="p-3 border border-gray-200 text-sm text-gray-800">{region.name2}</td>
                          <td className="p-3 border border-gray-200 text-center">
                            <button 
                              onClick={() => {
                                setEditingRegion(region._id);
                                setEditName1(region.name1);
                                setEditName2(region.name2);
                              }} 
                              className="text-blue-600 hover:text-blue-800 mr-3 text-sm font-medium"
                            >
                              Edit
                            </button>
                            <button onClick={() => handleDeleteRegion(region._id)} className="text-red-600 hover:text-red-800 text-sm font-medium">Delete</button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <table className="w-full border-collapse min-w-max">
              <thead>
                <tr>
                  <th className="p-3 border border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider sticky left-0 z-10 w-32">
                    {activeTab === 'postal' ? 'Sender / Receiver' : 'Departure / Arrival'}
                  </th>
                  {regions.map(region => (
                    <th key={region._id} className="p-3 border border-gray-200 bg-gray-50 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider w-24">
                      {region.name2}
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
          )}
        </div>
      </div>
    </div>
  );
}
