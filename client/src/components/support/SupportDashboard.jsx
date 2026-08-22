import React from 'react';
import { 
  FileText, 
  Calendar, 
  Users, 
  CheckCircle,
  ArrowUp,
  Plus,
  AlertCircle
} from 'lucide-react';

export default function SupportDashboard() {
  const recentActivity = [
    { id: 1, staff: 'Sarah Jenkins', type: 'Expense Claim #4092', status: 'Approved', statusColor: 'bg-green-100 text-green-700', date: 'Today, 10:45 AM' },
    { id: 2, staff: 'Michael Chen', type: 'Annual Leave (Nov 2-5)', status: 'Pending Supervisor', statusColor: 'bg-yellow-100 text-yellow-700', date: 'Today, 09:15 AM' },
    { id: 3, staff: 'Emily Rodriguez', type: 'Travel Advance #4105', status: 'In Finance Review', statusColor: 'bg-blue-100 text-blue-700', date: 'Yesterday, 04:30 PM' },
    { id: 4, staff: 'David Kim', type: 'Sick Leave (Oct 24)', status: 'Approved', statusColor: 'bg-green-100 text-green-700', date: 'Yesterday, 08:10 AM' },
    { id: 5, staff: 'Jessica Taylor', type: 'Mileage Claim #4088', status: 'Returned for Edits', statusColor: 'bg-red-100 text-red-700', date: 'Oct 22, 02:20 PM' }
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-[#162D50]">Support Team Dashboard</h1>
        <div className="flex items-center space-x-2 bg-white border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 shadow-sm cursor-pointer hover:bg-gray-50">
          <Calendar className="w-4 h-4 text-gray-500" />
          <span>This Week (Oct 23 - Oct 29)</span>
          <ChevronDownIcon className="w-4 h-4 text-gray-500 ml-2" />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Card 1 */}
        <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-sm font-medium text-gray-700">Active Claims (Team)</h3>
            <div className="p-2 bg-blue-50 rounded-md text-blue-500 opacity-80">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-end justify-between mt-4">
            <span className="text-3xl font-bold text-[#162D50]">24</span>
            <div className="flex items-center bg-blue-50 text-blue-600 px-2 py-1 rounded text-xs font-semibold">
              <ArrowUp className="w-3 h-3 mr-1" />
              5 new
            </div>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-sm font-medium text-gray-700">Leave Requests (Pending)</h3>
            <div className="p-2 bg-gray-100 rounded-md text-gray-400 opacity-80">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-end justify-between mt-4">
            <span className="text-3xl font-bold text-[#162D50]">7</span>
            <div className="flex items-center bg-orange-50 text-orange-600 px-2 py-1 rounded text-xs font-semibold">
              Requires Action
            </div>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-sm font-medium text-gray-700">Today's Scheduled Shifts</h3>
            <div className="p-2 bg-gray-100 rounded-md text-gray-400 opacity-80">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-end justify-between mt-4">
            <span className="text-3xl font-bold text-[#162D50]">18</span>
            <div className="flex items-center bg-green-50 text-green-600 px-2 py-1 rounded text-xs font-semibold">
              90% Coverage
            </div>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-sm font-medium text-gray-700">Task Completion Rate</h3>
            <div className="p-2 bg-gray-100 rounded-full border-4 border-gray-200 text-gray-400 opacity-80">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-end justify-between mt-4">
            <span className="text-3xl font-bold text-[#162D50]">82%</span>
            <div className="flex items-center bg-green-50 text-green-600 px-2 py-1 rounded text-xs font-semibold">
              <ArrowUp className="w-3 h-3 mr-1" />
              4%
            </div>
          </div>
        </div>

      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Activity Table */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <h2 className="font-bold text-[#162D50]">Team's Recent Activity</h2>
            <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">View Full Log</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 bg-white">
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Staff Member</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Request Type</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Date/Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentActivity.map((activity) => (
                  <tr key={activity.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{activity.staff}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{activity.type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-medium border border-transparent ${activity.statusColor} border-current border-opacity-20`}>
                        {activity.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{activity.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Task Delegation */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <h2 className="font-bold text-[#162D50]">Task Delegation</h2>
            <button className="text-gray-400 hover:text-gray-600">
              <Plus className="w-5 h-5" />
            </button>
          </div>
          
          <div className="p-6">
            <div className="flex justify-between items-center text-center mb-6">
              <div className="w-1/2 border-r border-gray-200">
                <div className="text-2xl font-bold text-[#162D50]">12</div>
                <div className="text-xs font-bold text-gray-500 tracking-wider">PENDING</div>
              </div>
              <div className="w-1/2">
                <div className="text-2xl font-bold text-green-600">45</div>
                <div className="text-xs font-bold text-gray-500 tracking-wider">COMPLETED</div>
              </div>
            </div>

            <div className="space-y-3">
              
              <div className="border border-gray-200 rounded-md p-3 flex items-start">
                <div className="mt-0.5 mr-3">
                  <div className="w-4 h-4 rounded-full border-2 border-blue-400"></div>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#162D50]">Q3 Expense Audits</h4>
                  <p className="text-xs text-gray-500 mt-1">Assigned to: Sarah J. &bull; Due: Oct 27</p>
                </div>
              </div>

              <div className="border border-gray-200 rounded-md p-3 flex items-start">
                <div className="mt-0.5 mr-3">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#162D50]">Verify Overtime Logs</h4>
                  <p className="text-xs text-red-500 mt-1">Assigned to: Michael C. &bull; Overdue</p>
                </div>
              </div>

              <div className="border border-gray-200 rounded-md p-3 flex items-start">
                <div className="mt-0.5 mr-3">
                  <div className="w-4 h-4 rounded-full border-2 border-blue-400"></div>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#162D50]">Update Policy Docs</h4>
                  <p className="text-xs text-gray-500 mt-1">Assigned to: Emily R. &bull; Due: Nov 01</p>
                </div>
              </div>

            </div>
          </div>
          
          <div className="mt-auto border-t border-gray-200 p-4 text-center">
            <button className="text-sm font-bold text-[#162D50] hover:text-blue-700">Manage All Tasks</button>
          </div>
        </div>

      </div>
    </div>
  );
}

function ChevronDownIcon(props) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6"/>
    </svg>
  );
}
