import React, { useState, useEffect } from 'react';
import JapaneseRegionManagement from './JapaneseRegionManagement.jsx';
import PostageRateMatrix from './PostageRateMatrix.jsx';
import TravelRateMatrix from './TravelRateMatrix.jsx';
import { loadRegions, saveRegions } from '../../utils/regionHelper.js';
import { apiFetch } from '../../utils/apiFetch.js';


export default function ExpenseSetup() {
  const [activeTab, setActiveTab] = useState('postal');
  const [japaneseRegions, setJapaneseRegions] = useState(() => loadRegions());

  // Fetch Japanese regions from MongoDB backend on mount
  useEffect(() => {
    let isMounted = true;
    const fetchRemoteRegions = async () => {
      try {
        const res = await apiFetch('/api/expenses/japanese-regions');
        if (res.ok) {
          const remoteData = await res.json();
          if (Array.isArray(remoteData) && remoteData.length > 0) {
            if (isMounted) {
              setJapaneseRegions(remoteData);
              saveRegions(remoteData);
            }
          }
        }
      } catch (err) {
        console.warn('Could not fetch remote Japanese regions:', err);
      }
    };
    fetchRemoteRegions();
    return () => { isMounted = false; };
  }, []);

  // Sync Japanese regions with local storage / custom events
  useEffect(() => {
    const handleRegionsUpdate = (e) => {
      if (e.detail) {
        setJapaneseRegions(e.detail);
      }
    };
    window.addEventListener('oms_regions_updated', handleRegionsUpdate);
    return () => {
      window.removeEventListener('oms_regions_updated', handleRegionsUpdate);
    };
  }, []);

  // Handler for region updates (saves to local + server DB)
  const handleRegionsChange = async (nextRegions) => {
    setJapaneseRegions(nextRegions);
    saveRegions(nextRegions);
    try {
      await apiFetch('/api/expenses/japanese-regions', {
        method: 'PUT',
        body: JSON.stringify(nextRegions)
      });
    } catch (err) {
      console.warn('Could not persist regions to server:', err);
    }
  };




  return (
    <div className="flex flex-col h-full bg-[#F8F9FA]" translate="no">
      
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
          <span>郵便料金</span>
        </button>
        <button
          onClick={() => setActiveTab('travel')}
          className={`px-6 py-2 rounded-md font-medium transition-colors ${
            activeTab === 'travel' 
              ? 'bg-[#162D50] text-white' 
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <span>交通費</span>
        </button>
        <button
          onClick={() => setActiveTab('regions')}
          className={`px-6 py-2 rounded-md font-medium transition-colors ${
            activeTab === 'regions' 
              ? 'bg-[#162D50] text-white' 
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <span>地域管理</span>
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'postal' ? (
        <PostageRateMatrix regions={japaneseRegions} />
      ) : activeTab === 'travel' ? (
        <TravelRateMatrix regions={japaneseRegions} />
      ) : (
        <div className="flex flex-col flex-1 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-[#162D50]">地域管理</h2>
          </div>
          <div className="p-6 overflow-auto">
            <div className="max-w-5xl">
              <JapaneseRegionManagement 
                regions={japaneseRegions} 
                onRegionsChange={handleRegionsChange} 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
