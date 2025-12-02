import React, { useState } from 'react';
import { 
  UserPlus, 
  Briefcase, 
  Database,
  ArrowLeft,
  Users,
  FileText,
  Trash2,
  Edit,
  Eye,
  MoreVertical,
  X,
  Save
} from 'lucide-react';
import { useDataStore, useThemeStore } from '../store/useStore';
import AddPersonForm from './forms/AddPersonForm';
import RecordCaseForm from './forms/RecordCaseForm';

const AdminPage = ({ onBack }) => {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  const { persons, cases, drugSeizures, deletePerson, deleteCase, updatePerson, updateCase } = useDataStore();
  
  const [activeTab, setActiveTab] = useState('persons'); // 'persons' | 'cases' | 'add-person' | 'add-case'
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [editingPerson, setEditingPerson] = useState(null);
  const [editingCase, setEditingCase] = useState(null);

  const handleDeletePerson = (personId) => {
    deletePerson(personId);
    setDeleteConfirm(null);
  };

  const handleDeleteCase = (caseId) => {
    deleteCase(caseId);
    setDeleteConfirm(null);
  };

  const handleSavePerson = (e) => {
    e.preventDefault();
    updatePerson(editingPerson.PersonID, editingPerson);
    setEditingPerson(null);
  };

  const handleSaveCase = (e) => {
    e.preventDefault();
    updateCase(editingCase.CaseID, editingCase);
    setEditingCase(null);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'add-person':
        return (
          <AddPersonForm 
            onClose={() => setActiveTab('persons')}
            onSuccess={() => setActiveTab('persons')}
          />
        );
      
      case 'add-case':
        return (
          <RecordCaseForm 
            onClose={() => setActiveTab('cases')}
            onSuccess={() => setActiveTab('cases')}
          />
        );
      
      case 'persons':
        return (
          <div className={`rounded-xl overflow-hidden flex flex-col ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
            {/* Header */}
            <div className={`px-6 py-4 border-b flex items-center justify-between flex-shrink-0
              ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center gap-3">
                <Users className={`w-5 h-5 ${isDark ? 'text-cyan-400' : 'text-blue-600'}`} />
                <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Persons Database ({persons.length})
                </h3>
              </div>
              <button
                onClick={() => setActiveTab('add-person')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
                  ${isDark 
                    ? 'bg-cyan-600 hover:bg-cyan-500 text-white' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
              >
                <UserPlus className="w-4 h-4" />
                Add Person
              </button>
            </div>

            {/* Table - Scrollable */}
            <div className="overflow-auto max-h-[calc(100vh-320px)]">
              <table className="w-full">
                <thead className={isDark ? 'bg-slate-900/50' : 'bg-gray-50'}>
                  <tr>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider
                      ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                      Person
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider
                      ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                      National ID
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider
                      ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                      Status
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider
                      ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                      Gender
                    </th>
                    <th className={`px-6 py-3 text-right text-xs font-medium uppercase tracking-wider
                      ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-slate-700' : 'divide-gray-200'}`}>
                  {persons.map((person) => (
                    <tr key={person.PersonID} className={`transition-colors
                      ${isDark ? 'hover:bg-slate-700/50' : 'hover:bg-gray-50'}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white
                            ${person.Status === 'Arrested' ? 'bg-red-600' : 
                              person.Status === 'At Large' ? 'bg-purple-600' : 'bg-yellow-600'}`}>
                            {person.FirstName[0]}{person.LastName[0]}
                          </div>
                          <div>
                            <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {person.FirstName} {person.LastName}
                            </p>
                            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                              "{person.Alias}"
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap font-mono text-sm
                        ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                        {person.NationalID}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`badge ${
                          person.Status === 'Arrested' ? 'badge-arrested' :
                          person.Status === 'At Large' ? 'badge-at-large' : 'badge-suspect'
                        }`}>
                          {person.Status}
                        </span>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm
                        ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                        {person.Gender === 'M' ? 'Male' : person.Gender === 'F' ? 'Female' : 'Other'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setEditingPerson({...person})}
                            className={`p-1.5 rounded transition-colors ${isDark ? 'hover:bg-slate-600 text-cyan-400' : 'hover:bg-gray-200 text-blue-600'}`}
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm({ type: 'person', id: person.PersonID, name: `${person.FirstName} ${person.LastName}` })}
                            className="p-1.5 rounded hover:bg-red-600/20 text-red-500 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      
      case 'cases':
        return (
          <div className={`rounded-xl overflow-hidden flex flex-col ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
            {/* Header */}
            <div className={`px-6 py-4 border-b flex items-center justify-between flex-shrink-0
              ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center gap-3">
                <FileText className={`w-5 h-5 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
                <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Cases Database ({cases.length})
                </h3>
              </div>
              <button
                onClick={() => setActiveTab('add-case')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
                  ${isDark 
                    ? 'bg-amber-600 hover:bg-amber-500 text-white' 
                    : 'bg-amber-500 hover:bg-amber-600 text-white'}`}
              >
                <Briefcase className="w-4 h-4" />
                Record Case
              </button>
            </div>

            {/* Table - Scrollable */}
            <div className="overflow-auto max-h-[calc(100vh-320px)]">
              <table className="w-full">
                <thead className={isDark ? 'bg-slate-900/50' : 'bg-gray-50'}>
                  <tr>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider
                      ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                      Case Number
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider
                      ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                      Type
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider
                      ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                      Date
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider
                      ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                      Status
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider
                      ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                      Seizures
                    </th>
                    <th className={`px-6 py-3 text-right text-xs font-medium uppercase tracking-wider
                      ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-slate-700' : 'divide-gray-200'}`}>
                  {cases.map((caseItem) => {
                    const caseSeizures = drugSeizures.filter(s => s.CaseID === caseItem.CaseID);
                    return (
                      <tr key={caseItem.CaseID} className={`transition-colors
                        ${isDark ? 'hover:bg-slate-700/50' : 'hover:bg-gray-50'}`}>
                        <td className={`px-6 py-4 whitespace-nowrap font-mono text-sm
                          ${isDark ? 'text-cyan-400' : 'text-blue-600'}`}>
                          {caseItem.CaseNumber}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm
                          ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                          {caseItem.CaseType}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm
                          ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                          {new Date(caseItem.ArrestDate).toLocaleDateString('th-TH')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`badge ${
                            caseItem.Status === 'Under Investigation' ? 'badge-pending' :
                            caseItem.Status === 'Adjudicated' ? 'badge-arrested' :
                            caseItem.Status === 'Closed' ? 'badge-active' : 'badge-suspect'
                          }`}>
                            {caseItem.Status}
                          </span>
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm
                          ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                          {caseSeizures.length} item{caseSeizures.length !== 1 ? 's' : ''}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setEditingCase({...caseItem})}
                              className={`p-1.5 rounded transition-colors ${isDark ? 'hover:bg-slate-600 text-cyan-400' : 'hover:bg-gray-200 text-blue-600'}`}
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm({ type: 'case', id: caseItem.CaseID, name: caseItem.CaseNumber })}
                              className="p-1.5 rounded hover:bg-red-600/20 text-red-500 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`h-full flex flex-col ${isDark ? 'bg-slate-950' : 'bg-gray-100'}`}>
      {/* Header */}
      <header className={`border-b px-6 py-4 flex-shrink-0
        ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className={`p-2 rounded-lg transition-colors
                ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-gray-100 text-gray-600'}`}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Admin Data Entry
              </h1>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                Manage persons, cases, and intelligence data
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Database className={`w-5 h-5 ${isDark ? 'text-slate-400' : 'text-gray-500'}`} />
            <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
              {persons.length} Persons • {cases.length} Cases • {drugSeizures.length} Seizures
            </span>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className={`border-b px-6 flex-shrink-0
        ${isDark ? 'bg-slate-900/50 border-slate-700' : 'bg-white border-gray-200'}`}>
        <nav className="flex gap-1">
          {[
            { id: 'persons', label: 'Persons', icon: Users },
            { id: 'cases', label: 'Cases', icon: FileText },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors
                ${activeTab === tab.id || activeTab === `add-${tab.id.slice(0, -1)}`
                  ? isDark 
                    ? 'border-cyan-500 text-cyan-400' 
                    : 'border-blue-600 text-blue-600'
                  : isDark
                    ? 'border-transparent text-slate-400 hover:text-slate-200'
                    : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto">
          {renderContent()}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className={`rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl
            ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
            <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Confirm Deletion
            </h3>
            <p className={`mb-6 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
              Are you sure you want to delete <strong>{deleteConfirm.name}</strong>? 
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors
                  ${isDark 
                    ? 'bg-slate-700 hover:bg-slate-600 text-slate-200' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (deleteConfirm.type === 'person') {
                    handleDeletePerson(deleteConfirm.id);
                  } else {
                    handleDeleteCase(deleteConfirm.id);
                  }
                }}
                className="px-4 py-2 rounded-lg font-medium text-sm bg-red-600 hover:bg-red-700 text-white transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Person Modal */}
      {editingPerson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className={`rounded-xl max-w-2xl w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto
            ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
            {/* Header */}
            <div className={`px-6 py-4 border-b flex items-center justify-between sticky top-0
              ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
              <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Edit Person
              </h3>
              <button
                onClick={() => setEditingPerson(null)}
                className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-gray-100 text-gray-500'}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Form */}
            <form onSubmit={handleSavePerson} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                    First Name
                  </label>
                  <input
                    type="text"
                    value={editingPerson.FirstName}
                    onChange={(e) => setEditingPerson({...editingPerson, FirstName: e.target.value})}
                    className={`w-full px-3 py-2 rounded-lg border focus:ring-2 focus:outline-none
                      ${isDark 
                        ? 'bg-slate-700 border-slate-600 text-white focus:ring-cyan-500' 
                        : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500'}`}
                    required
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={editingPerson.LastName}
                    onChange={(e) => setEditingPerson({...editingPerson, LastName: e.target.value})}
                    className={`w-full px-3 py-2 rounded-lg border focus:ring-2 focus:outline-none
                      ${isDark 
                        ? 'bg-slate-700 border-slate-600 text-white focus:ring-cyan-500' 
                        : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500'}`}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                    Alias
                  </label>
                  <input
                    type="text"
                    value={editingPerson.Alias || ''}
                    onChange={(e) => setEditingPerson({...editingPerson, Alias: e.target.value})}
                    className={`w-full px-3 py-2 rounded-lg border focus:ring-2 focus:outline-none
                      ${isDark 
                        ? 'bg-slate-700 border-slate-600 text-white focus:ring-cyan-500' 
                        : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500'}`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                    National ID
                  </label>
                  <input
                    type="text"
                    value={editingPerson.NationalID}
                    onChange={(e) => setEditingPerson({...editingPerson, NationalID: e.target.value})}
                    className={`w-full px-3 py-2 rounded-lg border focus:ring-2 focus:outline-none
                      ${isDark 
                        ? 'bg-slate-700 border-slate-600 text-white focus:ring-cyan-500' 
                        : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500'}`}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={editingPerson.DateOfBirth ? editingPerson.DateOfBirth.split('T')[0] : ''}
                    onChange={(e) => setEditingPerson({...editingPerson, DateOfBirth: e.target.value})}
                    className={`w-full px-3 py-2 rounded-lg border focus:ring-2 focus:outline-none
                      ${isDark 
                        ? 'bg-slate-700 border-slate-600 text-white focus:ring-cyan-500' 
                        : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500'}`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                    Gender
                  </label>
                  <select
                    value={editingPerson.Gender}
                    onChange={(e) => setEditingPerson({...editingPerson, Gender: e.target.value})}
                    className={`w-full px-3 py-2 rounded-lg border focus:ring-2 focus:outline-none
                      ${isDark 
                        ? 'bg-slate-700 border-slate-600 text-white focus:ring-cyan-500' 
                        : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500'}`}
                  >
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                    <option value="O">Other</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                  Status
                </label>
                <select
                  value={editingPerson.Status}
                  onChange={(e) => setEditingPerson({...editingPerson, Status: e.target.value})}
                  className={`w-full px-3 py-2 rounded-lg border focus:ring-2 focus:outline-none
                    ${isDark 
                      ? 'bg-slate-700 border-slate-600 text-white focus:ring-cyan-500' 
                      : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500'}`}
                >
                  <option value="Suspect">Suspect</option>
                  <option value="At Large">At Large</option>
                  <option value="Arrested">Arrested</option>
                </select>
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                  Address
                </label>
                <textarea
                  value={editingPerson.HomeAddress || editingPerson.Address || ''}
                  onChange={(e) => setEditingPerson({...editingPerson, HomeAddress: e.target.value})}
                  rows={2}
                  className={`w-full px-3 py-2 rounded-lg border focus:ring-2 focus:outline-none resize-none
                    ${isDark 
                      ? 'bg-slate-700 border-slate-600 text-white focus:ring-cyan-500' 
                      : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500'}`}
                />
              </div>
              
              {/* Footer */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setEditingPerson(null)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors
                    ${isDark 
                      ? 'bg-slate-700 hover:bg-slate-600 text-slate-200' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors
                    ${isDark 
                      ? 'bg-cyan-600 hover:bg-cyan-500 text-white' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                >
                  <Save className="w-4 h-4" />
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Case Modal */}
      {editingCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className={`rounded-xl max-w-2xl w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto
            ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
            {/* Header */}
            <div className={`px-6 py-4 border-b flex items-center justify-between sticky top-0
              ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
              <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Edit Case
              </h3>
              <button
                onClick={() => setEditingCase(null)}
                className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-gray-100 text-gray-500'}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Form */}
            <form onSubmit={handleSaveCase} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                    Case Number
                  </label>
                  <input
                    type="text"
                    value={editingCase.CaseNumber}
                    onChange={(e) => setEditingCase({...editingCase, CaseNumber: e.target.value})}
                    className={`w-full px-3 py-2 rounded-lg border focus:ring-2 focus:outline-none
                      ${isDark 
                        ? 'bg-slate-700 border-slate-600 text-white focus:ring-cyan-500' 
                        : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500'}`}
                    required
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                    Case Type
                  </label>
                  <select
                    value={editingCase.CaseType}
                    onChange={(e) => setEditingCase({...editingCase, CaseType: e.target.value})}
                    className={`w-full px-3 py-2 rounded-lg border focus:ring-2 focus:outline-none
                      ${isDark 
                        ? 'bg-slate-700 border-slate-600 text-white focus:ring-cyan-500' 
                        : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500'}`}
                  >
                    <option value="Trafficking">Trafficking</option>
                    <option value="Possession">Possession</option>
                    <option value="Distribution">Distribution</option>
                    <option value="Manufacturing">Manufacturing</option>
                    <option value="Import/Export">Import/Export</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                    Arrest Date
                  </label>
                  <input
                    type="date"
                    value={editingCase.ArrestDate ? editingCase.ArrestDate.split('T')[0] : ''}
                    onChange={(e) => setEditingCase({...editingCase, ArrestDate: e.target.value})}
                    className={`w-full px-3 py-2 rounded-lg border focus:ring-2 focus:outline-none
                      ${isDark 
                        ? 'bg-slate-700 border-slate-600 text-white focus:ring-cyan-500' 
                        : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500'}`}
                    required
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                    Status
                  </label>
                  <select
                    value={editingCase.Status}
                    onChange={(e) => setEditingCase({...editingCase, Status: e.target.value})}
                    className={`w-full px-3 py-2 rounded-lg border focus:ring-2 focus:outline-none
                      ${isDark 
                        ? 'bg-slate-700 border-slate-600 text-white focus:ring-cyan-500' 
                        : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500'}`}
                  >
                    <option value="Under Investigation">Under Investigation</option>
                    <option value="Adjudicated">Adjudicated</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                  Description
                </label>
                <textarea
                  value={editingCase.Description || ''}
                  onChange={(e) => setEditingCase({...editingCase, Description: e.target.value})}
                  rows={3}
                  className={`w-full px-3 py-2 rounded-lg border focus:ring-2 focus:outline-none resize-none
                    ${isDark 
                      ? 'bg-slate-700 border-slate-600 text-white focus:ring-cyan-500' 
                      : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500'}`}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                    Arrest Location
                  </label>
                  <input
                    type="text"
                    value={editingCase.ArrestLocation || ''}
                    onChange={(e) => setEditingCase({...editingCase, ArrestLocation: e.target.value})}
                    className={`w-full px-3 py-2 rounded-lg border focus:ring-2 focus:outline-none
                      ${isDark 
                        ? 'bg-slate-700 border-slate-600 text-white focus:ring-cyan-500' 
                        : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500'}`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                    Investigating Officer
                  </label>
                  <input
                    type="text"
                    value={editingCase.InvestigatingOfficer || ''}
                    onChange={(e) => setEditingCase({...editingCase, InvestigatingOfficer: e.target.value})}
                    className={`w-full px-3 py-2 rounded-lg border focus:ring-2 focus:outline-none
                      ${isDark 
                        ? 'bg-slate-700 border-slate-600 text-white focus:ring-cyan-500' 
                        : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500'}`}
                  />
                </div>
              </div>
              
              {/* Footer */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setEditingCase(null)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors
                    ${isDark 
                      ? 'bg-slate-700 hover:bg-slate-600 text-slate-200' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors
                    ${isDark 
                      ? 'bg-amber-600 hover:bg-amber-500 text-white' 
                      : 'bg-amber-500 hover:bg-amber-600 text-white'}`}
                >
                  <Save className="w-4 h-4" />
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
