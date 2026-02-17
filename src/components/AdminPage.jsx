import React, { useState } from 'react';
import { 
  UserPlus, 
  Briefcase, 
  Database,
  Users,
  FileText,
  Trash2,
  Edit,
  Eye,
  MoreVertical,
  X,
  Save
} from 'lucide-react';
import { useDataStore } from '../store/useStore';
import { useShallow } from 'zustand/react/shallow';
import AddPersonForm from './forms/AddPersonForm';
import RecordCaseForm from './forms/RecordCaseForm';

const inputStyle = {
  background: 'var(--glass-thin)',
  border: '1px solid var(--border-subtle)',
  color: 'var(--text-primary)',
};

const inputFocusStyle = {
  background: 'var(--glass-regular)',
  borderColor: 'var(--accent-blue)',
  boxShadow: '0 0 0 3px rgba(10, 132, 255, 0.15)',
};

const AdminPage = () => {
  const { persons, cases, drugSeizures, deletePerson, deleteCase, updatePerson, updateCase } = useDataStore(
    useShallow(s => ({
      persons: s.persons, cases: s.cases, drugSeizures: s.drugSeizures,
      deletePerson: s.deletePerson, deleteCase: s.deleteCase,
      updatePerson: s.updatePerson, updateCase: s.updateCase,
    }))
  );
  
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
          <div className="spatial-card rounded-2xl overflow-hidden flex flex-col">
            {/* Header */}
            <div
              className="px-5 py-3 flex items-center justify-between flex-shrink-0"
              style={{ background: 'var(--glass-thin)', borderBottom: '1px solid var(--border-subtle)' }}
            >
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4" style={{ color: 'var(--accent-cyan)' }} />
                <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Persons Database ({persons.length})
                </h3>
              </div>
              <button
                onClick={() => setActiveTab('add-person')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-90 active:scale-95"
                style={{ background: 'var(--accent-blue)', color: 'white', boxShadow: '0 4px 16px rgba(10, 132, 255, 0.3)' }}
              >
                <UserPlus className="w-3.5 h-3.5" />
                Add Person
              </button>
            </div>

            {/* Table - Scrollable */}
            <div className="overflow-auto flex-1">
              <table className="w-full">
                <thead>
                  <tr style={{ background: 'var(--glass-ultra-thin)' }}>
                    <th
                      className="px-6 py-3 text-left text-[10px] font-bold uppercase"
                      style={{ letterSpacing: '0.08em', color: 'var(--text-quaternary)', borderBottom: '1px solid var(--border-subtle)' }}
                    >
                      Person
                    </th>
                    <th
                      className="px-6 py-3 text-left text-[10px] font-bold uppercase"
                      style={{ letterSpacing: '0.08em', color: 'var(--text-quaternary)', borderBottom: '1px solid var(--border-subtle)' }}
                    >
                      National ID
                    </th>
                    <th
                      className="px-6 py-3 text-left text-[10px] font-bold uppercase"
                      style={{ letterSpacing: '0.08em', color: 'var(--text-quaternary)', borderBottom: '1px solid var(--border-subtle)' }}
                    >
                      Status
                    </th>
                    <th
                      className="px-6 py-3 text-left text-[10px] font-bold uppercase"
                      style={{ letterSpacing: '0.08em', color: 'var(--text-quaternary)', borderBottom: '1px solid var(--border-subtle)' }}
                    >
                      Gender
                    </th>
                    <th
                      className="px-6 py-3 text-right text-[10px] font-bold uppercase"
                      style={{ letterSpacing: '0.08em', color: 'var(--text-quaternary)', borderBottom: '1px solid var(--border-subtle)' }}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {persons.map((person) => (
                    <tr
                      key={person.PersonID}
                      className="transition-colors cursor-default"
                      style={{ borderBottom: '1px solid var(--border-subtle)' }}
                      onMouseOver={(e) => e.currentTarget.style.background = 'var(--glass-ultra-thin)'}
                      onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold"
                            style={{
                              background: person.Status === 'Arrested'
                                ? 'var(--accent-red)'
                                : person.Status === 'At Large'
                                  ? 'var(--accent-purple)'
                                  : 'var(--accent-orange)'
                            }}
                          >
                            {person.FirstName[0]}{person.LastName[0]}
                          </div>
                          <div>
                            <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                              {person.FirstName} {person.LastName}
                            </p>
                            <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                              "{person.Alias}"
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-sm" style={{ color: 'var(--text-secondary)' }}>
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {person.Gender === 'M' ? 'Male' : person.Gender === 'F' ? 'Female' : 'Other'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setEditingPerson({...person})}
                            className="p-1.5 rounded-lg transition-colors"
                            style={{ color: 'var(--accent-blue)' }}
                            onMouseOver={(e) => e.currentTarget.style.background = 'var(--glass-regular)'}
                            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm({ type: 'person', id: person.PersonID, name: `${person.FirstName} ${person.LastName}` })}
                            className="p-1.5 rounded-lg transition-colors"
                            style={{ color: 'var(--accent-red)' }}
                            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 69, 58, 0.12)'}
                            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
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
          <div className="spatial-card rounded-2xl overflow-hidden flex flex-col">
            {/* Header */}
            <div
              className="px-5 py-3 flex items-center justify-between flex-shrink-0"
              style={{ background: 'var(--glass-thin)', borderBottom: '1px solid var(--border-subtle)' }}
            >
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4" style={{ color: 'var(--accent-orange)' }} />
                <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Cases Database ({cases.length})
                </h3>
              </div>
              <button
                onClick={() => setActiveTab('add-case')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-90 active:scale-95"
                style={{ background: 'var(--accent-orange)', color: 'white', boxShadow: '0 4px 16px rgba(255, 159, 10, 0.3)' }}
              >
                <Briefcase className="w-3.5 h-3.5" />
                Record Case
              </button>
            </div>

            {/* Table - Scrollable */}
            <div className="overflow-auto flex-1">
              <table className="w-full">
                <thead>
                  <tr style={{ background: 'var(--glass-ultra-thin)' }}>
                    <th
                      className="px-6 py-3 text-left text-[10px] font-bold uppercase"
                      style={{ letterSpacing: '0.08em', color: 'var(--text-quaternary)', borderBottom: '1px solid var(--border-subtle)' }}
                    >
                      Case Number
                    </th>
                    <th
                      className="px-6 py-3 text-left text-[10px] font-bold uppercase"
                      style={{ letterSpacing: '0.08em', color: 'var(--text-quaternary)', borderBottom: '1px solid var(--border-subtle)' }}
                    >
                      Type
                    </th>
                    <th
                      className="px-6 py-3 text-left text-[10px] font-bold uppercase"
                      style={{ letterSpacing: '0.08em', color: 'var(--text-quaternary)', borderBottom: '1px solid var(--border-subtle)' }}
                    >
                      Date
                    </th>
                    <th
                      className="px-6 py-3 text-left text-[10px] font-bold uppercase"
                      style={{ letterSpacing: '0.08em', color: 'var(--text-quaternary)', borderBottom: '1px solid var(--border-subtle)' }}
                    >
                      Status
                    </th>
                    <th
                      className="px-6 py-3 text-left text-[10px] font-bold uppercase"
                      style={{ letterSpacing: '0.08em', color: 'var(--text-quaternary)', borderBottom: '1px solid var(--border-subtle)' }}
                    >
                      Seizures
                    </th>
                    <th
                      className="px-6 py-3 text-right text-[10px] font-bold uppercase"
                      style={{ letterSpacing: '0.08em', color: 'var(--text-quaternary)', borderBottom: '1px solid var(--border-subtle)' }}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {cases.map((caseItem) => {
                    const caseSeizures = drugSeizures.filter(s => s.CaseID === caseItem.CaseID);
                    return (
                      <tr
                        key={caseItem.CaseID}
                        className="transition-colors cursor-default"
                        style={{ borderBottom: '1px solid var(--border-subtle)' }}
                        onMouseOver={(e) => e.currentTarget.style.background = 'var(--glass-ultra-thin)'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <td className="px-6 py-4 whitespace-nowrap font-mono text-sm" style={{ color: 'var(--accent-blue)' }}>
                          {caseItem.CaseNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: 'var(--text-secondary)' }}>
                          {caseItem.CaseType}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: 'var(--text-secondary)' }}>
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: 'var(--text-secondary)' }}>
                          {caseSeizures.length} item{caseSeizures.length !== 1 ? 's' : ''}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setEditingCase({...caseItem})}
                              className="p-1.5 rounded-lg transition-colors"
                              style={{ color: 'var(--accent-blue)' }}
                              onMouseOver={(e) => e.currentTarget.style.background = 'var(--glass-regular)'}
                              onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm({ type: 'case', id: caseItem.CaseID, name: caseItem.CaseNumber })}
                              className="p-1.5 rounded-lg transition-colors"
                              style={{ color: 'var(--accent-red)' }}
                              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 69, 58, 0.12)'}
                              onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
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
    <div className="h-full flex flex-col">
      {/* Admin Sub-Header — sits below the floating header */}
      <div className="flex items-center justify-between px-6 py-3 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--glass-ultra-thin)' }}
      >
        <div className="flex items-center gap-3">
          <Database className="w-4 h-4" style={{ color: 'var(--accent-purple)' }} />
          <h1 className="text-[15px] font-semibold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Admin Data Entry
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium" style={{ color: 'var(--text-tertiary)' }}>
            {persons.length} Persons · {cases.length} Cases · {drugSeizures.length} Seizures
          </span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div
        className="px-6 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--border-subtle)' }}
      >
        <nav className="flex gap-1">
          {[
            { id: 'persons', label: 'Persons', icon: Users },
            { id: 'cases', label: 'Cases', icon: FileText },
          ].map(tab => {
            const isActive = activeTab === tab.id || activeTab === `add-${tab.id.slice(0, -1)}`;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors"
                style={{
                  borderBottom: isActive ? '2px solid var(--accent-blue)' : '2px solid transparent',
                  color: isActive ? 'var(--accent-blue)' : 'var(--text-tertiary)',
                }}
                onMouseOver={(e) => {
                  if (!isActive) e.currentTarget.style.color = 'var(--text-primary)';
                }}
                onMouseOut={(e) => {
                  if (!isActive) e.currentTarget.style.color = 'var(--text-tertiary)';
                }}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div
            className="glass-floating rounded-2xl p-6 max-w-md w-full mx-4 animate-fade-in-scale"
          >
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              Confirm Deletion
            </h3>
            <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
              Are you sure you want to delete <strong>{deleteConfirm.name}</strong>? 
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 rounded-xl font-medium text-sm transition-all hover:opacity-80 active:scale-95"
                style={{ background: 'var(--glass-thin)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}
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
                className="px-4 py-2 rounded-xl font-medium text-sm transition-all hover:opacity-90 active:scale-95"
                style={{ background: 'var(--accent-red)', color: 'white', boxShadow: '0 4px 16px rgba(255, 69, 58, 0.3)' }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Person Modal */}
      {editingPerson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div
            className="glass-floating rounded-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto animate-fade-in-scale"
          >
            {/* Header */}
            <div
              className="px-6 py-4 flex items-center justify-between sticky top-0 z-10"
              style={{
                background: 'var(--bg-floating)',
                backdropFilter: 'blur(80px) saturate(220%)',
                borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                Edit Person
              </h3>
              <button
                onClick={() => setEditingPerson(null)}
                className="p-2 rounded-xl transition-colors"
                style={{ color: 'var(--text-tertiary)' }}
                onMouseOver={(e) => e.currentTarget.style.background = 'var(--glass-regular)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Form */}
            <form onSubmit={handleSavePerson} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                    First Name
                  </label>
                  <input
                    type="text"
                    value={editingPerson.FirstName}
                    onChange={(e) => setEditingPerson({...editingPerson, FirstName: e.target.value})}
                    className="w-full px-3 py-2 rounded-xl focus:ring-2 focus:outline-none transition-all"
                    style={inputStyle}
                    onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                    onBlur={(e) => Object.assign(e.target.style, inputStyle)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={editingPerson.LastName}
                    onChange={(e) => setEditingPerson({...editingPerson, LastName: e.target.value})}
                    className="w-full px-3 py-2 rounded-xl focus:ring-2 focus:outline-none transition-all"
                    style={inputStyle}
                    onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                    onBlur={(e) => Object.assign(e.target.style, inputStyle)}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Alias
                  </label>
                  <input
                    type="text"
                    value={editingPerson.Alias || ''}
                    onChange={(e) => setEditingPerson({...editingPerson, Alias: e.target.value})}
                    className="w-full px-3 py-2 rounded-xl focus:ring-2 focus:outline-none transition-all"
                    style={inputStyle}
                    onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                    onBlur={(e) => Object.assign(e.target.style, inputStyle)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                    National ID
                  </label>
                  <input
                    type="text"
                    value={editingPerson.NationalID}
                    onChange={(e) => setEditingPerson({...editingPerson, NationalID: e.target.value})}
                    className="w-full px-3 py-2 rounded-xl focus:ring-2 focus:outline-none transition-all"
                    style={inputStyle}
                    onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                    onBlur={(e) => Object.assign(e.target.style, inputStyle)}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={editingPerson.DateOfBirth ? editingPerson.DateOfBirth.split('T')[0] : ''}
                    onChange={(e) => setEditingPerson({...editingPerson, DateOfBirth: e.target.value})}
                    className="w-full px-3 py-2 rounded-xl focus:ring-2 focus:outline-none transition-all"
                    style={inputStyle}
                    onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                    onBlur={(e) => Object.assign(e.target.style, inputStyle)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Gender
                  </label>
                  <select
                    value={editingPerson.Gender}
                    onChange={(e) => setEditingPerson({...editingPerson, Gender: e.target.value})}
                    className="w-full px-3 py-2 rounded-xl focus:ring-2 focus:outline-none transition-all"
                    style={inputStyle}
                    onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                    onBlur={(e) => Object.assign(e.target.style, inputStyle)}
                  >
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                    <option value="O">Other</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Status
                </label>
                <select
                  value={editingPerson.Status}
                  onChange={(e) => setEditingPerson({...editingPerson, Status: e.target.value})}
                  className="w-full px-3 py-2 rounded-xl focus:ring-2 focus:outline-none transition-all"
                  style={inputStyle}
                  onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                  onBlur={(e) => Object.assign(e.target.style, inputStyle)}
                >
                  <option value="Suspect">Suspect</option>
                  <option value="At Large">At Large</option>
                  <option value="Arrested">Arrested</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Address
                </label>
                <textarea
                  value={editingPerson.HomeAddress || editingPerson.Address || ''}
                  onChange={(e) => setEditingPerson({...editingPerson, HomeAddress: e.target.value})}
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl focus:ring-2 focus:outline-none resize-none transition-all"
                  style={inputStyle}
                  onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                  onBlur={(e) => Object.assign(e.target.style, inputStyle)}
                />
              </div>
              
              {/* Footer */}
              <div className="flex justify-end gap-3 pt-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                <button
                  type="button"
                  onClick={() => setEditingPerson(null)}
                  className="px-4 py-2 rounded-xl font-medium text-sm transition-all hover:opacity-80 active:scale-95"
                  style={{ background: 'var(--glass-thin)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all hover:opacity-90 active:scale-95"
                  style={{ background: 'var(--accent-blue)', color: 'white', boxShadow: '0 4px 16px rgba(10, 132, 255, 0.3)' }}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div
            className="glass-floating rounded-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto animate-fade-in-scale"
          >
            {/* Header */}
            <div
              className="px-6 py-4 flex items-center justify-between sticky top-0 z-10"
              style={{
                background: 'var(--bg-floating)',
                backdropFilter: 'blur(80px) saturate(220%)',
                borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                Edit Case
              </h3>
              <button
                onClick={() => setEditingCase(null)}
                className="p-2 rounded-xl transition-colors"
                style={{ color: 'var(--text-tertiary)' }}
                onMouseOver={(e) => e.currentTarget.style.background = 'var(--glass-regular)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Form */}
            <form onSubmit={handleSaveCase} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Case Number
                  </label>
                  <input
                    type="text"
                    value={editingCase.CaseNumber}
                    onChange={(e) => setEditingCase({...editingCase, CaseNumber: e.target.value})}
                    className="w-full px-3 py-2 rounded-xl focus:ring-2 focus:outline-none transition-all"
                    style={inputStyle}
                    onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                    onBlur={(e) => Object.assign(e.target.style, inputStyle)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Case Type
                  </label>
                  <select
                    value={editingCase.CaseType}
                    onChange={(e) => setEditingCase({...editingCase, CaseType: e.target.value})}
                    className="w-full px-3 py-2 rounded-xl focus:ring-2 focus:outline-none transition-all"
                    style={inputStyle}
                    onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                    onBlur={(e) => Object.assign(e.target.style, inputStyle)}
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
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Arrest Date
                  </label>
                  <input
                    type="date"
                    value={editingCase.ArrestDate ? editingCase.ArrestDate.split('T')[0] : ''}
                    onChange={(e) => setEditingCase({...editingCase, ArrestDate: e.target.value})}
                    className="w-full px-3 py-2 rounded-xl focus:ring-2 focus:outline-none transition-all"
                    style={inputStyle}
                    onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                    onBlur={(e) => Object.assign(e.target.style, inputStyle)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Status
                  </label>
                  <select
                    value={editingCase.Status}
                    onChange={(e) => setEditingCase({...editingCase, Status: e.target.value})}
                    className="w-full px-3 py-2 rounded-xl focus:ring-2 focus:outline-none transition-all"
                    style={inputStyle}
                    onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                    onBlur={(e) => Object.assign(e.target.style, inputStyle)}
                  >
                    <option value="Under Investigation">Under Investigation</option>
                    <option value="Adjudicated">Adjudicated</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Description
                </label>
                <textarea
                  value={editingCase.Description || ''}
                  onChange={(e) => setEditingCase({...editingCase, Description: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl focus:ring-2 focus:outline-none resize-none transition-all"
                  style={inputStyle}
                  onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                  onBlur={(e) => Object.assign(e.target.style, inputStyle)}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Arrest Location
                  </label>
                  <input
                    type="text"
                    value={editingCase.ArrestLocation || ''}
                    onChange={(e) => setEditingCase({...editingCase, ArrestLocation: e.target.value})}
                    className="w-full px-3 py-2 rounded-xl focus:ring-2 focus:outline-none transition-all"
                    style={inputStyle}
                    onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                    onBlur={(e) => Object.assign(e.target.style, inputStyle)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Investigating Officer
                  </label>
                  <input
                    type="text"
                    value={editingCase.InvestigatingOfficer || ''}
                    onChange={(e) => setEditingCase({...editingCase, InvestigatingOfficer: e.target.value})}
                    className="w-full px-3 py-2 rounded-xl focus:ring-2 focus:outline-none transition-all"
                    style={inputStyle}
                    onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                    onBlur={(e) => Object.assign(e.target.style, inputStyle)}
                  />
                </div>
              </div>
              
              {/* Footer */}
              <div className="flex justify-end gap-3 pt-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                <button
                  type="button"
                  onClick={() => setEditingCase(null)}
                  className="px-4 py-2 rounded-xl font-medium text-sm transition-all hover:opacity-80 active:scale-95"
                  style={{ background: 'var(--glass-thin)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all hover:opacity-90 active:scale-95"
                  style={{ background: 'var(--accent-blue)', color: 'white', boxShadow: '0 4px 16px rgba(10, 132, 255, 0.3)' }}
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
