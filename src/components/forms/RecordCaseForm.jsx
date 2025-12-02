import React, { useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Briefcase, 
  Save, 
  X, 
  Plus,
  Trash2,
  UserPlus,
  AlertCircle,
  CheckCircle,
  Search,
  Pill,
  MapPin
} from 'lucide-react';
import { useDataStore, useThemeStore } from '../../store/useStore';
import LocationPicker from '../LocationPicker';

// Validation schema for seizure (matches DRUG_SEIZURE table)
const seizureSchema = z.object({
  DrugType: z.string().min(1, 'ประเภทยาจำเป็นต้องระบุ'),
  Quantity: z.number().positive('ปริมาณต้องมากกว่า 0'),
  Unit: z.string().min(1, 'หน่วยจำเป็นต้องระบุ'),
  EstimatedValue: z.number().min(0).optional().nullable(),
  StorageLocation: z.string().optional(),
  Notes: z.string().optional()
});

// Validation schema for case (matches CASE table)
const caseSchema = z.object({
  CaseNumber: z.string().min(1, 'เลขที่คดีจำเป็นต้องระบุ'),
  CaseType: z.string().min(1, 'ประเภทความผิดจำเป็นต้องระบุ'),
  ArrestDate: z.string().min(1, 'วันที่จับกุมจำเป็นต้องระบุ'),
  Status: z.string().min(1, 'สถานะคดีจำเป็นต้องระบุ'),
  Description: z.string().optional(),
  OfficerInCharge: z.string().optional(),
  CourtCaseNumber: z.string().optional(),
  Verdict: z.string().optional(),
  // Location fields
  AddressDetail: z.string().optional(),
  Province: z.string().optional(),
  District: z.string().optional(),
  SubDistrict: z.string().optional(),
  PostalCode: z.string().optional(),
  LocationType: z.string().optional(),
  seizures: z.array(seizureSchema).optional()
});

// Case types (matching schema description)
const CASE_TYPES = [
  { value: 'Possession', label: 'ครอบครอง' },
  { value: 'Trafficking', label: 'ค้า/จำหน่าย' },
  { value: 'Distribution', label: 'จัดจำหน่าย' },
  { value: 'Manufacturing', label: 'ผลิต' },
  { value: 'Import', label: 'นำเข้า' },
  { value: 'Export', label: 'ส่งออก' },
  { value: 'Conspiracy', label: 'สมคบ' }
];

// Case status options (matching schema)
const CASE_STATUS = [
  { value: 'Under Investigation', label: 'อยู่ระหว่างสืบสวน' },
  { value: 'Pending', label: 'รอดำเนินการ' },
  { value: 'Filed', label: 'ส่งฟ้อง' },
  { value: 'Court', label: 'อยู่ระหว่างพิจารณาคดี' },
  { value: 'Adjudicated', label: 'ศาลตัดสินแล้ว' },
  { value: 'Closed', label: 'ปิดคดี' },
  { value: 'Appealed', label: 'อุทธรณ์' }
];

// Drug types (matching DrugType lookup table)
const DRUG_TYPES = [
  { value: 'Methamphetamine', label: 'ยาบ้า/ยาไอซ์' },
  { value: 'Crystal Meth', label: 'ไอซ์' },
  { value: 'Heroin', label: 'เฮโรอีน' },
  { value: 'Cocaine', label: 'โคเคน' },
  { value: 'Cannabis', label: 'กัญชา' },
  { value: 'Ecstasy', label: 'ยาอี/เอ็กซ์ตาซี' },
  { value: 'Ketamine', label: 'เคตามีน' },
  { value: 'Kratom', label: 'กระท่อม' },
  { value: 'Fentanyl', label: 'เฟนทานิล' },
  { value: 'LSD', label: 'แอลเอสดี' },
  { value: 'Other', label: 'อื่นๆ' }
];

const UNITS = [
  { value: 'pills', label: 'เม็ด' },
  { value: 'kg', label: 'กิโลกรัม' },
  { value: 'g', label: 'กรัม' },
  { value: 'mg', label: 'มิลลิกรัม' },
  { value: 'ml', label: 'มิลลิลิตร' },
  { value: 'L', label: 'ลิตร' }
];

// Location types
const LOCATION_TYPES = [
  { value: 'CrimeScene', label: 'ที่เกิดเหตุ' },
  { value: 'ArrestLocation', label: 'สถานที่จับกุม' },
  { value: 'Warehouse', label: 'คลังสินค้า/แหล่งเก็บ' },
  { value: 'DropPoint', label: 'จุดส่ง' },
  { value: 'Laboratory', label: 'แหล่งผลิต' },
  { value: 'Other', label: 'อื่นๆ' }
];

// Person roles in case
const PERSON_ROLES = [
  { value: 'Main Suspect', label: 'ผู้ต้องหาหลัก' },
  { value: 'Accomplice', label: 'ผู้สมรู้ร่วมคิด' },
  { value: 'Courier', label: 'ผู้ขนส่ง' },
  { value: 'Witness', label: 'พยาน' },
  { value: 'Informant', label: 'สายข่าว' },
  { value: 'Victim', label: 'ผู้เสียหาย' }
];

const RecordCaseForm = ({ onClose, onSuccess }) => {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  const { addCase, addLocation, persons, cases } = useDataStore();
  
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [involvedPersons, setInvolvedPersons] = useState([]);
  const [personSearch, setPersonSearch] = useState('');
  const [showPersonDropdown, setShowPersonDropdown] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  // Generate Thai Buddhist year case number
  const thaiYear = new Date().getFullYear() + 543;
  const defaultCaseNumber = `NCB-CR-${thaiYear}-${String(cases.length + 1).padStart(4, '0')}`;

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    watch,
    reset
  } = useForm({
    resolver: zodResolver(caseSchema),
    defaultValues: {
      CaseNumber: defaultCaseNumber,
      CaseType: 'Possession',
      ArrestDate: new Date().toISOString().slice(0, 16),
      Status: 'Under Investigation',
      Description: '',
      OfficerInCharge: '',
      CourtCaseNumber: '',
      Verdict: '',
      AddressDetail: '',
      Province: '',
      District: '',
      SubDistrict: '',
      PostalCode: '',
      LocationType: 'CrimeScene',
      seizures: []
    }
  });

  const { fields: seizureFields, append: appendSeizure, remove: removeSeizure } = useFieldArray({
    control,
    name: 'seizures'
  });

  // Filter persons for search
  const filteredPersons = persons.filter(p => {
    const query = personSearch.toLowerCase();
    return (
      p.FirstName.toLowerCase().includes(query) ||
      p.LastName.toLowerCase().includes(query) ||
      (p.Alias && p.Alias.toLowerCase().includes(query)) ||
      p.NationalID.includes(query)
    ) && !involvedPersons.some(ip => ip.personId === p.PersonID);
  });

  const addInvolvedPerson = (person, role = 'Accomplice') => {
    setInvolvedPersons([...involvedPersons, {
      personId: person.PersonID,
      person,
      role,
      details: ''
    }]);
    setPersonSearch('');
    setShowPersonDropdown(false);
  };

  const removeInvolvedPerson = (personId) => {
    setInvolvedPersons(involvedPersons.filter(ip => ip.personId !== personId));
  };

  const updatePersonRole = (personId, role) => {
    setInvolvedPersons(involvedPersons.map(ip => 
      ip.personId === personId ? { ...ip, role } : ip
    ));
  };

  const updatePersonDetails = (personId, details) => {
    setInvolvedPersons(involvedPersons.map(ip => 
      ip.personId === personId ? { ...ip, details } : ip
    ));
  };

  const onSubmit = async (data) => {
    try {
      // Create location first if coordinates or address provided
      let locationId = null;
      if (selectedLocation || data.AddressDetail) {
        const newLocation = {
          AddressDetail: data.AddressDetail || `พิกัด: ${selectedLocation?.lat.toFixed(6)}, ${selectedLocation?.lng.toFixed(6)}`,
          Latitude: selectedLocation?.lat || 0,
          Longitude: selectedLocation?.lng || 0,
          LocationType: data.LocationType || 'CrimeScene',
          Province: data.Province || null,
          District: data.District || null,
          SubDistrict: data.SubDistrict || null,
          PostalCode: data.PostalCode || null
        };
        
        locationId = await addLocation(newLocation);
      }

      // Prepare case data (matching Case table schema)
      const caseData = {
        CaseNumber: data.CaseNumber,
        CaseType: data.CaseType,
        ArrestDate: new Date(data.ArrestDate).toISOString(),
        LocationID: locationId,
        Status: data.Status,
        Description: data.Description || null,
        OfficerInCharge: data.OfficerInCharge || null,
        CourtCaseNumber: data.CourtCaseNumber || null,
        Verdict: data.Verdict || null
      };

      // Prepare seizures (matching DrugSeizure table schema)
      const seizures = (data.seizures || []).map(s => ({
        DrugType: s.DrugType,
        Quantity: parseFloat(s.Quantity),
        Unit: s.Unit,
        EstimatedValue: s.EstimatedValue ? parseFloat(s.EstimatedValue) : null,
        StorageLocation: s.StorageLocation || 'คลังเก็บของกลาง ปปส.',
        Notes: s.Notes || null
      }));

      // Add case with involved persons and seizures
      await addCase(caseData, involvedPersons, seizures);
      
      setSubmitStatus('success');
      setTimeout(() => {
        reset();
        setSelectedLocation(null);
        setInvolvedPersons([]);
        onSuccess && onSuccess();
      }, 1500);

    } catch (error) {
      console.error('Error recording case:', error);
      setSubmitStatus('error');
    }
  };

  return (
    <div className={`rounded-xl overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
      {/* Header */}
      <div className={`px-6 py-4 border-b flex items-center justify-between
        ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isDark ? 'bg-amber-600' : 'bg-amber-500'}`}>
            <Briefcase className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              บันทึกคดีใหม่
            </h3>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
              บันทึกข้อมูลคดียาเสพติดและผู้ที่เกี่ยวข้อง
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors
              ${isDark ? 'hover:bg-slate-700' : 'hover:bg-gray-200'}`}
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
        {/* Case Number and Type */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">เลขที่คดี *</label>
            <input
              {...register('CaseNumber')}
              className={`form-input font-mono ${errors.CaseNumber ? 'border-red-500' : ''}`}
            />
            {errors.CaseNumber && (
              <p className="form-error">{errors.CaseNumber.message}</p>
            )}
          </div>
          
          <div>
            <label className="form-label">ประเภทความผิด *</label>
            <select {...register('CaseType')} className="form-select">
              {CASE_TYPES.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Date and Status */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">วันที่จับกุม *</label>
            <input
              type="datetime-local"
              {...register('ArrestDate')}
              className={`form-input ${errors.ArrestDate ? 'border-red-500' : ''}`}
            />
            {errors.ArrestDate && (
              <p className="form-error">{errors.ArrestDate.message}</p>
            )}
          </div>
          
          <div>
            <label className="form-label">สถานะคดี *</label>
            <select {...register('Status')} className="form-select">
              {CASE_STATUS.map(status => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Officer and Court Info */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">พนักงานสอบสวนผู้รับผิดชอบ</label>
            <input
              {...register('OfficerInCharge')}
              className="form-input"
              placeholder="เช่น พ.ต.อ. สมชาย ใจดี"
            />
          </div>
          
          <div>
            <label className="form-label">เลขคดีศาล</label>
            <input
              {...register('CourtCaseNumber')}
              className="form-input"
              placeholder="เช่น อ.1234/2567"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="form-label">รายละเอียดคดี</label>
          <textarea
            {...register('Description')}
            className="form-input min-h-[80px]"
            placeholder="บันทึกรายละเอียดคดี สถานการณ์การจับกุม"
          />
        </div>

        {/* Verdict (if applicable) */}
        <div>
          <label className="form-label">คำพิพากษา</label>
          <textarea
            {...register('Verdict')}
            className="form-input min-h-[60px]"
            placeholder="บันทึกคำพิพากษา (ถ้ามี)"
          />
        </div>

        {/* Location Section */}
        <div className={`p-4 rounded-lg ${isDark ? 'bg-slate-900/50' : 'bg-gray-50'}`}>
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-4 h-4" />
            <label className="form-label mb-0">สถานที่เกิดเหตุ/จับกุม</label>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="form-label text-xs">ที่อยู่โดยละเอียด</label>
              <input
                {...register('AddressDetail')}
                className="form-input text-sm"
                placeholder="เลขที่ ซอย ถนน"
              />
            </div>
            
            <div>
              <label className="form-label text-xs">ประเภทสถานที่</label>
              <select {...register('LocationType')} className="form-select text-sm">
                {LOCATION_TYPES.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="form-label text-xs">จังหวัด</label>
              <input
                {...register('Province')}
                className="form-input text-sm"
                placeholder="จังหวัด"
              />
            </div>
            
            <div>
              <label className="form-label text-xs">อำเภอ/เขต</label>
              <input
                {...register('District')}
                className="form-input text-sm"
                placeholder="อำเภอ/เขต"
              />
            </div>
            
            <div>
              <label className="form-label text-xs">ตำบล/แขวง</label>
              <input
                {...register('SubDistrict')}
                className="form-input text-sm"
                placeholder="ตำบล/แขวง"
              />
            </div>
            
            <div>
              <label className="form-label text-xs">รหัสไปรษณีย์</label>
              <input
                {...register('PostalCode')}
                className="form-input text-sm"
                placeholder="รหัสไปรษณีย์"
                maxLength={5}
              />
            </div>
          </div>

          <div>
            <label className="form-label text-xs">พิกัดบนแผนที่</label>
            <LocationPicker
              value={selectedLocation}
              onChange={setSelectedLocation}
              placeholder="คลิกบนแผนที่เพื่อระบุพิกัด"
            />
          </div>
        </div>

        {/* Involved Persons Section */}
        <div className={`p-4 rounded-lg ${isDark ? 'bg-slate-900/50' : 'bg-gray-50'}`}>
          <div className="flex items-center justify-between mb-3">
            <label className="form-label mb-0 flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              บุคคลที่เกี่ยวข้องในคดี
            </label>
            <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
              {involvedPersons.length} คน
            </span>
          </div>

          {/* Person Search */}
          <div className="relative mb-3">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 
              ${isDark ? 'text-slate-400' : 'text-gray-400'}`} />
            <input
              type="text"
              value={personSearch}
              onChange={(e) => {
                setPersonSearch(e.target.value);
                setShowPersonDropdown(true);
              }}
              onFocus={() => setShowPersonDropdown(true)}
              placeholder="ค้นหาด้วยชื่อ นามสกุล ฉายา หรือเลขประจำตัว..."
              className="form-input pl-10"
            />
            
            {/* Dropdown */}
            {showPersonDropdown && personSearch && (
              <div className={`absolute z-10 w-full mt-1 rounded-lg shadow-lg max-h-48 overflow-y-auto
                ${isDark ? 'bg-slate-800 border border-slate-600' : 'bg-white border border-gray-200'}`}>
                {filteredPersons.length > 0 ? (
                  filteredPersons.slice(0, 5).map(person => (
                    <button
                      key={person.PersonID}
                      type="button"
                      onClick={() => addInvolvedPerson(person)}
                      className={`w-full px-4 py-2 text-left flex items-center gap-3 transition-colors
                        ${isDark ? 'hover:bg-slate-700' : 'hover:bg-gray-100'}`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm
                        ${person.Status === 'Arrested' ? 'bg-red-600' : 
                          person.RiskLevel === 'Critical' ? 'bg-purple-600' :
                          person.RiskLevel === 'High' ? 'bg-orange-600' : 'bg-yellow-600'} text-white`}>
                        {person.FirstName[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {person.FirstName} {person.LastName}
                        </p>
                        <p className={`text-xs truncate ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                          "{person.Alias}" • {person.NationalID}
                        </p>
                      </div>
                      <Plus className="w-4 h-4 text-green-500" />
                    </button>
                  ))
                ) : (
                  <p className={`px-4 py-3 text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                    ไม่พบบุคคลที่ค้นหา
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Selected Persons */}
          {involvedPersons.length > 0 && (
            <div className="space-y-2">
              {involvedPersons.map(({ personId, person, role, details }) => (
                <div 
                  key={personId}
                  className={`p-3 rounded-lg
                    ${isDark ? 'bg-slate-800' : 'bg-white border border-gray-200'}`}
                >
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    {/* Avatar */}
                    <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center
                      ${person.Status === 'Arrested' ? 'bg-red-600' : 
                        person.RiskLevel === 'Critical' ? 'bg-purple-600' :
                        person.RiskLevel === 'High' ? 'bg-orange-600' : 'bg-yellow-600'} text-white`}>
                      {person.FirstName[0]}{person.LastName[0]}
                    </div>
                    {/* Name Info */}
                    <div className="flex-1 min-w-[120px]">
                      <p className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {person.FirstName} {person.LastName}
                      </p>
                      <p className={`text-xs truncate ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                        "{person.Alias}"
                      </p>
                    </div>
                    {/* Role & Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <select
                        value={role}
                        onChange={(e) => updatePersonRole(personId, e.target.value)}
                        className="form-select text-sm py-1 w-32"
                      >
                        {PERSON_ROLES.map(r => (
                          <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => removeInvolvedPerson(personId)}
                        className="p-1.5 rounded hover:bg-red-600/20 text-red-500 transition-colors flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <input
                      type="text"
                      value={details}
                      onChange={(e) => updatePersonDetails(personId, e.target.value)}
                      placeholder="รายละเอียดการเกี่ยวข้อง เช่น หัวหน้าเครือข่าย ผู้ขนส่ง"
                      className="form-input text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Drug Seizures Section */}
        <div className={`p-4 rounded-lg ${isDark ? 'bg-slate-900/50' : 'bg-gray-50'}`}>
          <div className="flex items-center justify-between mb-3">
            <label className="form-label mb-0 flex items-center gap-2">
              <Pill className="w-4 h-4" />
              ของกลางยาเสพติด
            </label>
            <button
              type="button"
              onClick={() => appendSeizure({
                DrugType: '',
                Quantity: 0,
                Unit: 'pills',
                EstimatedValue: null,
                StorageLocation: 'คลังเก็บของกลาง ปปส.',
                Notes: ''
              })}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                ${isDark 
                  ? 'bg-cyan-600 hover:bg-cyan-500 text-white' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
            >
              <Plus className="w-3 h-3" />
              เพิ่มของกลาง
            </button>
          </div>

          {seizureFields.length === 0 ? (
            <p className={`text-sm py-4 text-center ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
              ยังไม่มีของกลาง คลิก "เพิ่มของกลาง" เพื่อบันทึกยาเสพติดที่ยึดได้
            </p>
          ) : (
            <div className="space-y-3">
              {seizureFields.map((field, index) => (
                <div 
                  key={field.id}
                  className={`p-4 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-white border border-gray-200'}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                      ของกลางที่ #{index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeSeizure(index)}
                      className="p-1.5 rounded hover:bg-red-600/20 text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="form-label text-xs">ประเภทยาเสพติด *</label>
                      <select
                        {...register(`seizures.${index}.DrugType`)}
                        className="form-select text-sm"
                      >
                        <option value="">เลือกประเภท</option>
                        {DRUG_TYPES.map(type => (
                          <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="form-label text-xs">ปริมาณ *</label>
                        <input
                          type="number"
                          step="0.01"
                          {...register(`seizures.${index}.Quantity`, { valueAsNumber: true })}
                          className="form-input text-sm"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="form-label text-xs">หน่วย *</label>
                        <select
                          {...register(`seizures.${index}.Unit`)}
                          className="form-select text-sm"
                        >
                          {UNITS.map(unit => (
                            <option key={unit.value} value={unit.value}>{unit.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    <div>
                      <label className="form-label text-xs">มูลค่าประมาณการ (บาท)</label>
                      <input
                        type="number"
                        step="0.01"
                        {...register(`seizures.${index}.EstimatedValue`, { valueAsNumber: true })}
                        className="form-input text-sm"
                        placeholder="0.00"
                      />
                    </div>
                    
                    <div>
                      <label className="form-label text-xs">สถานที่เก็บของกลาง</label>
                      <input
                        {...register(`seizures.${index}.StorageLocation`)}
                        className="form-input text-sm"
                        placeholder="คลังเก็บของกลาง ปปส."
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="form-label text-xs">หมายเหตุ</label>
                      <input
                        {...register(`seizures.${index}.Notes`)}
                        className="form-input text-sm"
                        placeholder="เช่น ตราสัญลักษณ์ ลักษณะเฉพาะ"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Status */}
        {submitStatus && (
          <div className={`flex items-center gap-2 p-3 rounded-lg ${
            submitStatus === 'success' 
              ? isDark ? 'bg-green-900/30 text-green-400' : 'bg-green-50 text-green-600'
              : isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-600'
          }`}>
            {submitStatus === 'success' ? (
              <>
                <CheckCircle className="w-5 h-5" />
                <span>บันทึกคดีสำเร็จ!</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-5 h-5" />
                <span>เกิดข้อผิดพลาด กรุณาลองใหม่</span>
              </>
            )}
          </div>
        )}

        {/* Actions */}
        <div className={`flex justify-end gap-3 pt-4 border-t 
          ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors
                ${isDark 
                  ? 'bg-slate-700 hover:bg-slate-600 text-slate-200' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
            >
              ยกเลิก
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium text-sm transition-colors
              ${isDark 
                ? 'bg-amber-600 hover:bg-amber-500 text-white disabled:bg-slate-600' 
                : 'bg-amber-500 hover:bg-amber-600 text-white disabled:bg-gray-400'}
              disabled:cursor-not-allowed`}
          >
            <Save className="w-4 h-4" />
            {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกคดี'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RecordCaseForm;
