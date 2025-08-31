import React, { useState } from 'react';
import { Users, Search, Filter, Clock, MapPin, Phone, Mail, Calendar, Activity } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { staff, shifts } from '../utils/mockData';
import type { Staff, Shift } from '../types';

const StaffPage: React.FC = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState<'roster' | 'schedule'>('roster');

  // Get unique departments
  const departments = Array.from(new Set(staff.map(s => s.department)));

  // Filter staff based on search and department
  const filteredStaff = staff.filter(member => {
    const searchString = `${member.firstName} ${member.lastName} ${member.role} ${member.department}`.toLowerCase();
    const matchesSearch = searchString.includes(searchTerm.toLowerCase());
    const matchesDepartment = !selectedDepartment || member.department === selectedDepartment;
    return matchesSearch && matchesDepartment;
  });

  // Get shifts for selected date
  const todayShifts = shifts.filter(shift => shift.date === selectedDate);

  // Get current active shifts
  const getCurrentShiftStatus = (staffId: string) => {
    const currentTime = new Date();
    const currentHour = currentTime.getHours();
    const currentMinute = currentTime.getMinutes();
    const currentTimeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
    
    const todayShift = todayShifts.find(shift => 
      shift.staffId === staffId && 
      shift.status === 'active'
    );
    
    if (todayShift) {
      return {
        isOnDuty: true,
        shift: todayShift,
        timeRemaining: calculateTimeRemaining(todayShift.endTime)
      };
    }
    
    return { isOnDuty: false, shift: null, timeRemaining: null };
  };

  const calculateTimeRemaining = (endTime: string) => {
    const now = new Date();
    const [endHour, endMinute] = endTime.split(':').map(Number);
    const endDate = new Date();
    endDate.setHours(endHour, endMinute, 0, 0);
    
    // Handle overnight shifts
    if (endDate < now) {
      endDate.setDate(endDate.getDate() + 1);
    }
    
    const diffMs = endDate.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m`;
    }
    return `${diffMinutes}m`;
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'doctor':
        return 'bg-blue-100 text-blue-800';
      case 'nurse':
        return 'bg-green-100 text-green-800';
      case 'technician':
        return 'bg-purple-100 text-purple-800';
      case 'admin':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getShiftStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Check if user has permission to view staff
  const canViewStaff = user?.role === 'doctor' || user?.role === 'admin' || user?.role === 'nurse';

  if (!canViewStaff) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-8">
            <div className="max-w-7xl mx-auto text-center py-12">
              <h2 className="text-2xl font-semibold text-gray-900">Access Restricted</h2>
              <p className="mt-2 text-gray-600">Only medical staff can view the staff roster.</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-blue-600" />
                <h1 className="text-3xl font-bold text-gray-900">Staff Roster</h1>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('roster')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      viewMode === 'roster' 
                        ? 'bg-white text-gray-900 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Staff Roster
                  </button>
                  <button
                    onClick={() => setViewMode('schedule')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      viewMode === 'schedule' 
                        ? 'bg-white text-gray-900 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Today's Schedule
                  </button>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="mb-6 flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="search"
                  placeholder="Search staff members..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Departments</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
              {viewMode === 'schedule' && (
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}
            </div>

            {viewMode === 'roster' ? (
              /* Staff Roster View */
              <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Staff Member
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Role & Department
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Contact Information
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Current Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Shift End Time
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredStaff.map((member) => {
                        const shiftStatus = getCurrentShiftStatus(member.id);
                        
                        return (
                          <tr key={member.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                  <span className="font-medium text-sm">
                                    {member.firstName[0]}{member.lastName[0]}
                                  </span>
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {member.role === 'doctor' ? 'Dr. ' : ''}{member.firstName} {member.lastName}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    ID: {member.employeeId}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleColor(member.role)}`}>
                                {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                              </span>
                              <div className="text-sm text-gray-500 mt-1">{member.department}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center text-sm text-gray-900">
                                <Phone className="h-4 w-4 mr-1" />
                                {member.contactNumber}
                              </div>
                              <div className="flex items-center text-sm text-gray-500 mt-1">
                                <Mail className="h-4 w-4 mr-1" />
                                {member.email}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {shiftStatus.isOnDuty ? (
                                <div className="flex items-center">
                                  <div className="h-2 w-2 bg-green-400 rounded-full mr-2"></div>
                                  <span className="text-sm font-medium text-green-800">On Duty</span>
                                </div>
                              ) : (
                                <div className="flex items-center">
                                  <div className="h-2 w-2 bg-gray-400 rounded-full mr-2"></div>
                                  <span className="text-sm text-gray-600">Off Duty</span>
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {shiftStatus.isOnDuty && shiftStatus.shift ? (
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {shiftStatus.shift.endTime}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {shiftStatus.timeRemaining} remaining
                                  </div>
                                </div>
                              ) : (
                                <span className="text-sm text-gray-500">Not scheduled</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* Schedule View */
              <div className="space-y-6">
                {/* Schedule Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <div className="flex items-center">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Activity className="h-6 w-6 text-green-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">On Duty Now</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {todayShifts.filter(s => s.status === 'active').length}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <div className="flex items-center">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Clock className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Scheduled Today</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {todayShifts.filter(s => s.status === 'scheduled').length}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <div className="flex items-center">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Users className="h-6 w-6 text-purple-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Total Shifts</p>
                        <p className="text-2xl font-bold text-gray-900">{todayShifts.length}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Schedule Timeline */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-medium text-gray-900">
                      Schedule for {new Date(selectedDate).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </h2>
                  </div>
                  
                  <div className="p-6">
                    {todayShifts.length > 0 ? (
                      <div className="space-y-4">
                        {todayShifts
                          .sort((a, b) => a.startTime.localeCompare(b.startTime))
                          .map((shift) => {
                            const staffMember = staff.find(s => s.id === shift.staffId);
                            if (!staffMember) return null;
                            
                            return (
                              <div key={shift.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                <div className="flex items-center space-x-4">
                                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                    <span className="font-medium text-sm">
                                      {staffMember.firstName[0]}{staffMember.lastName[0]}
                                    </span>
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">
                                      {staffMember.role === 'doctor' ? 'Dr. ' : ''}{staffMember.firstName} {staffMember.lastName}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {staffMember.role.charAt(0).toUpperCase() + staffMember.role.slice(1)} • {shift.department}
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="flex items-center space-x-6">
                                  <div className="text-right">
                                    <div className="flex items-center text-sm font-medium text-gray-900">
                                      <Clock className="h-4 w-4 mr-1" />
                                      {shift.startTime} - {shift.endTime}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {shift.type.charAt(0).toUpperCase() + shift.type.slice(1)} Shift
                                    </div>
                                  </div>
                                  
                                  <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getShiftStatusColor(shift.status)}`}>
                                    {shift.status === 'active' ? 'On Duty' : shift.status.charAt(0).toUpperCase() + shift.status.slice(1)}
                                  </span>
                                  
                                  {shift.status === 'active' && (
                                    <div className="text-right">
                                      <div className="text-sm font-medium text-green-600">
                                        {calculateTimeRemaining(shift.endTime)}
                                      </div>
                                      <div className="text-xs text-gray-500">remaining</div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No shifts scheduled</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          No staff members are scheduled for the selected date.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Department Breakdown */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-medium text-gray-900">Department Coverage</h2>
                  </div>
                  
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {departments.map(department => {
                        const deptShifts = todayShifts.filter(s => s.department === department);
                        const activeShifts = deptShifts.filter(s => s.status === 'active');
                        
                        return (
                          <div key={department} className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-medium text-gray-900">{department}</h3>
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                activeShifts.length > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                {activeShifts.length} on duty
                              </span>
                            </div>
                            <div className="text-sm text-gray-600">
                              {deptShifts.length} total shifts scheduled
                            </div>
                            {activeShifts.length > 0 && (
                              <div className="mt-2 space-y-1">
                                {activeShifts.map(shift => {
                                  const staffMember = staff.find(s => s.id === shift.staffId);
                                  return (
                                    <div key={shift.id} className="text-xs text-gray-500">
                                      {staffMember?.firstName} {staffMember?.lastName} (until {shift.endTime})
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default StaffPage;