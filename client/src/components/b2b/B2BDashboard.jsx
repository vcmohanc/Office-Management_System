import { useState, useEffect } from 'react';
import { Briefcase, Building, Handshake, FileText, ChevronDown, Eye, FileSignature, TrendingUp } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

export default function B2BDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get('search') || '';
  const statusFilter = searchParams.get('status') || '';

  const [metrics, setMetrics] = useState({
    activePartnersCount: 0,
    ongoingContractsCount: 0,
    pendingProposalsCount: 0,
    totalMonthlyRevenue: 0,
  });
  const [engagements, setEngagements] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });
  
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [loadingEngagements, setLoadingEngagements] = useState(true);

  // Fetch metrics
  useEffect(() => {
    const controller = new AbortController();
    setLoadingMetrics(true);

    fetch('http://localhost:5000/api/b2b/metrics', { signal: controller.signal })
      .then(res => res.json())
      .then(data => {
        setMetrics(data);
        setLoadingMetrics(false);
      })
      .catch(err => {
        if (err.name !== 'AbortError') {
          console.error('Failed to fetch metrics:', err);
          setLoadingMetrics(false);
        }
      });

    return () => controller.abort();
  }, []);

  // Fetch engagements based on search/filters
  useEffect(() => {
    const controller = new AbortController();
    setLoadingEngagements(true);

    const query = new URLSearchParams();
    if (search) query.set('search', search);
    if (statusFilter) query.set('status', statusFilter);
    query.set('page', '1'); // For simplicity, always fetch page 1 on filter change
    query.set('limit', '10');

    fetch(`http://localhost:5000/api/b2b/engagements?${query.toString()}`, { signal: controller.signal })
      .then(res => res.json())
      .then(data => {
        setEngagements(data.data || []);
        setPagination(data.pagination || { total: 0, page: 1, totalPages: 1 });
        setLoadingEngagements(false);
      })
      .catch(err => {
        if (err.name !== 'AbortError') {
          console.error('Failed to fetch engagements:', err);
          setLoadingEngagements(false);
        }
      });

    return () => controller.abort();
  }, [search, statusFilter]);

  const handleStatusChange = (e) => {
    if (e.target.value) {
      searchParams.set('status', e.target.value);
    } else {
      searchParams.delete('status');
    }
    setSearchParams(searchParams);
  };

  const formatCurrency = (amount) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}K`;
    }
    return `$${amount}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '--';
    const options = { year: 'numeric', month: 'short', day: '2-digit' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const renderStatusBadge = (status) => {
    let bg = 'bg-gray-100';
    let text = 'text-gray-700';

    if (status === 'Active') {
      bg = 'bg-green-100';
      text = 'text-green-700';
    } else if (status === 'Pending') {
      bg = 'bg-orange-100';
      text = 'text-orange-700';
    } else if (status === 'Expiring Soon') {
      bg = 'bg-red-100';
      text = 'text-red-700';
    } else if (status === 'Terminated') {
      bg = 'bg-gray-200';
      text = 'text-gray-600';
    }

    return (
      <span className={`px-3 py-1 ${bg} ${text} rounded-full text-xs font-bold inline-block w-[110px] text-center`}>
        {status}
      </span>
    );
  };

  return (
    <div className="flex flex-col space-y-6">
      {/* Banner */}
      <div className="bg-[#1e3a5f] rounded-xl p-8 flex flex-col items-center justify-center text-white shadow-md">
        <Handshake className="w-8 h-8 mb-3 text-blue-200" />
        <h2 className="text-sm font-bold tracking-widest text-blue-100">BUSINESS PARTNERSHIPS & CONTRACTS</h2>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#0f1f38] rounded-xl p-5 flex flex-col items-center justify-center text-white shadow-sm border border-[#0f1f38] transition-transform hover:scale-105">
          <Building className="w-6 h-6 mb-2 text-blue-200" />
          {loadingMetrics ? (
            <div className="w-16 h-8 bg-blue-900/50 animate-pulse rounded mb-1"></div>
          ) : (
            <p className="text-2xl font-bold mb-1">{metrics.activePartnersCount}</p>
          )}
          <p className="text-[10px] font-bold tracking-wider text-blue-100 uppercase">Active Partners</p>
        </div>

        <div className="bg-white rounded-xl p-5 flex flex-col items-center justify-center text-[#162D50] shadow-sm border border-gray-200 transition-transform hover:scale-105">
          <FileSignature className="w-6 h-6 mb-2 text-[#162D50]" />
          {loadingMetrics ? (
            <div className="w-16 h-8 bg-gray-200 animate-pulse rounded mb-1"></div>
          ) : (
            <p className="text-2xl font-bold mb-1">{metrics.ongoingContractsCount}</p>
          )}
          <p className="text-[10px] font-bold tracking-wider text-gray-500 uppercase">Ongoing Contracts</p>
        </div>

        <div className="bg-white rounded-xl p-5 flex flex-col items-center justify-center text-[#162D50] shadow-sm border border-gray-200 transition-transform hover:scale-105">
          <FileText className="w-6 h-6 mb-2 text-orange-500" />
          {loadingMetrics ? (
            <div className="w-16 h-8 bg-gray-200 animate-pulse rounded mb-1"></div>
          ) : (
            <p className="text-2xl font-bold mb-1">{metrics.pendingProposalsCount}</p>
          )}
          <p className="text-[10px] font-bold tracking-wider text-gray-500 uppercase">Pending Proposals</p>
        </div>

        <div className="bg-white rounded-xl p-5 flex flex-col items-center justify-center text-[#162D50] shadow-sm border border-gray-200 transition-transform hover:scale-105">
          <TrendingUp className="w-6 h-6 mb-2 text-green-600" />
          {loadingMetrics ? (
            <div className="w-20 h-8 bg-gray-200 animate-pulse rounded mb-1"></div>
          ) : (
            <p className="text-2xl font-bold mb-1">{formatCurrency(metrics.totalMonthlyRevenue)}</p>
          )}
          <p className="text-[10px] font-bold tracking-wider text-gray-500 uppercase">Monthly Revenue</p>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Table Header */}
        <div className="bg-[#F8F9FA] p-5 flex justify-between items-center border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Briefcase className="w-5 h-5 text-[#162D50]" />
            <h2 className="text-[#162D50] text-lg font-bold">Active B2B Engagements</h2>
          </div>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={handleStatusChange}
              className="appearance-none bg-white border border-gray-300 rounded-md pl-3 pr-10 py-1.5 text-sm text-gray-700 shadow-sm cursor-pointer hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#162D50]"
            >
              <option value="">Filter by Status</option>
              <option value="Active">Active</option>
              <option value="Pending">Pending</option>
              <option value="Expiring Soon">Expiring Soon</option>
              <option value="Terminated">Terminated</option>
            </select>
            <ChevronDown className="w-4 h-4 text-gray-500 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Partner Name</th>
                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Industry</th>
                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Contract Start Date</th>
                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-gray-100">
              
              {loadingEngagements ? (
                // Skeletons
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="bg-white">
                    <td className="py-5 px-6"><div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div></td>
                    <td className="py-5 px-6"><div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div></td>
                    <td className="py-5 px-6"><div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div></td>
                    <td className="py-5 px-6"><div className="h-6 bg-gray-200 rounded-full animate-pulse w-[110px]"></div></td>
                    <td className="py-5 px-6"><div className="h-8 w-8 bg-gray-200 rounded animate-pulse mx-auto"></div></td>
                  </tr>
                ))
              ) : engagements.length === 0 ? (
                // Empty State
                <tr className="bg-white">
                  <td colSpan="5" className="py-12 text-center text-gray-500">
                    <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-lg font-medium text-gray-600">No engagements found.</p>
                    <p className="text-sm">Try adjusting your search or filter criteria.</p>
                  </td>
                </tr>
              ) : (
                engagements.map((engagement) => (
                  <tr key={engagement._id} className="hover:bg-gray-50 transition-colors bg-white">
                    <td className="py-5 px-6 font-medium text-gray-900">{engagement.partner_name}</td>
                    <td className="py-5 px-6 text-gray-600">{engagement.industry}</td>
                    <td className="py-5 px-6 text-gray-600">{formatDate(engagement.contract_start_date)}</td>
                    <td className="py-5 px-6">
                      {renderStatusBadge(engagement.status)}
                    </td>
                    <td className="py-5 px-6 text-center">
                      <button className="text-gray-400 hover:text-blue-600 hover:bg-blue-50 p-2 rounded transition-colors" title="View Details">
                        <Eye className="w-5 h-5 mx-auto" />
                      </button>
                    </td>
                  </tr>
                ))
              )}

            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
