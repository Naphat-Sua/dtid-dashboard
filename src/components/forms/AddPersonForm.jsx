import React, { useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  User, 
  Save, 
  X, 
  Camera, 
  AlertCircle,
  CheckCircle,
  Phone,
  Plus,
  Trash2
} from 'lucide-react';
import { useDataStore, useThemeStore } from '../../store/useStore';
import LocationPicker from '../LocationPicker';

// Contact validation schema (matches PERSON_CONTACT table)
const contactSchema = z.object({
  ContactType: z.string().min(1, 'Contact type is required'),
  ContactValue: z.string().min(1, 'Contact value is required'),
  IsActive: z.boolean().default(true),
  Notes: z.string().optional()
});

// Validation schema (matches PERSON table from schema)
const personSchema = z.object({
  FirstName: z.string().min(1, 'ชื่อจริงจำเป็นต้องกรอก').max(100),
  LastName: z.string().min(1, 'นามสกุลจำเป็นต้องกรอก').max(100),
  Alias: z.string().max(255).optional(),
  NationalID: z.string()
    .length(13, 'เลขประจำตัวประชาชนต้องมี 13 หลัก')
    .regex(/^\d+$/, 'เลขประจำตัวประชาชนต้องเป็นตัวเลขเท่านั้น'),
  DateOfBirth: z.string().optional(),
  Gender: z.enum(['M', 'F', 'O']).optional(),
  HomeAddress: z.string().max(255).optional(),
  CurrentAddress: z.string().max(255).optional(),
  RiskLevel: z.enum(['Low', 'Medium', 'High', 'Critical']).default('Low'),
  Status: z.enum(['Active', 'Arrested', 'Released', 'Deceased', 'Unknown']).default('Active'),
  Notes: z.string().optional(),
  PhotoURL: z.string().url().optional().or(z.literal('')),
  contacts: z.array(contactSchema).optional()
});

// Contact type options (matches schema description)
const CONTACT_TYPES = [
  { value: 'Mobile', label: 'โทรศัพท์มือถือ' },
  { value: 'Line ID', label: 'Line ID' },
  { value: 'Facebook', label: 'Facebook' },
  { value: 'Email', label: 'อีเมล' },
  { value: 'WhatsApp', label: 'WhatsApp' },
  { value: 'Telegram', label: 'Telegram' },
  { value: 'Other', label: 'อื่นๆ' }
];

// Risk level options (matches schema ENUM)
const RISK_LEVELS = [
  { value: 'Low', label: 'ต่ำ', color: 'green' },
  { value: 'Medium', label: 'ปานกลาง', color: 'yellow' },
  { value: 'High', label: 'สูง', color: 'orange' },
  { value: 'Critical', label: 'วิกฤต', color: 'red' }
];

// Status options (matches schema ENUM)
const STATUS_OPTIONS = [
  { value: 'Active', label: 'เฝ้าระวัง' },
  { value: 'Arrested', label: 'ถูกจับกุม' },
  { value: 'Released', label: 'ปล่อยตัว' },
  { value: 'Deceased', label: 'เสียชีวิต' },
  { value: 'Unknown', label: 'ไม่ทราบ' }
];

const AddPersonForm = ({ onClose, onSuccess }) => {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  const { addPerson, addLocation, persons } = useDataStore();
  
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [submitStatus, setSubmitStatus] = useState(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    watch,
    setValue,
    reset
  } = useForm({
    resolver: zodResolver(personSchema),
    defaultValues: {
      FirstName: '',
      LastName: '',
      Alias: '',
      NationalID: '',
      DateOfBirth: '',
      Gender: 'M',
      HomeAddress: '',
      CurrentAddress: '',
      RiskLevel: 'Low',
      Status: 'Active',
      Notes: '',
      PhotoURL: '',
      contacts: []
    }
  });

  // Field array for contacts
  const { fields: contactFields, append: appendContact, remove: removeContact } = useFieldArray({
    control,
    name: 'contacts'
  });

  // Check for duplicate National ID
  const nationalId = watch('NationalID');
  const isDuplicateId = nationalId?.length === 13 && 
    persons.some(p => p.NationalID === nationalId);

  // Generate avatar URL based on name
  const generateAvatar = (firstName, lastName) => {
    const name = `${firstName}+${lastName}`.replace(/\s+/g, '+');
    return `https://ui-avatars.com/api/?name=${name}&background=random&size=200`;
  };

  const firstName = watch('FirstName');
  const lastName = watch('LastName');

  // Update photo preview when names change
  React.useEffect(() => {
    if (!photoPreview && firstName && lastName) {
      setPhotoPreview(generateAvatar(firstName, lastName));
    }
  }, [firstName, lastName, photoPreview]);

  const handlePhotoUrlChange = (url) => {
    setValue('PhotoURL', url);
    if (url) {
      setPhotoPreview(url);
    } else if (firstName && lastName) {
      setPhotoPreview(generateAvatar(firstName, lastName));
    }
  };

  const onSubmit = async (data) => {
    try {
      // Create location first if selected
      let locationId = null;
      if (selectedLocation) {
        const newLocation = {
          AddressDetail: data.HomeAddress || `${selectedLocation.lat.toFixed(4)}, ${selectedLocation.lng.toFixed(4)}`,
          Latitude: selectedLocation.lat,
          Longitude: selectedLocation.lng,
          LocationType: 'Home',
          Province: data.Province || null,
          District: data.District || null,
          SubDistrict: data.SubDistrict || null,
          PostalCode: data.PostalCode || null
        };
        
        // Add location and get the ID
        locationId = await addLocation(newLocation);
      }

      // Extract contacts from form data
      const contacts = (data.contacts || []).map(c => ({
        ContactType: c.ContactType,
        ContactValue: c.ContactValue,
        IsActive: c.IsActive ?? true,
        Notes: c.Notes || null
      }));

      // Create person with all fields matching the schema
      const newPerson = {
        FirstName: data.FirstName,
        LastName: data.LastName,
        Alias: data.Alias || null,
        NationalID: data.NationalID,
        DateOfBirth: data.DateOfBirth || null,
        Gender: data.Gender || null,
        HomeAddress: data.HomeAddress || null,
        CurrentAddress: data.CurrentAddress || null,
        RiskLevel: data.RiskLevel,
        Status: data.Status,
        Notes: data.Notes || null,
        PhotoURL: photoPreview || generateAvatar(data.FirstName, data.LastName),
        CurrentAddressID: locationId
      };

      // Add person with contacts
      await addPerson(newPerson, contacts);
      
      setSubmitStatus('success');
      setTimeout(() => {
        reset();
        setSelectedLocation(null);
        setPhotoPreview('');
        onSuccess && onSuccess();
      }, 1500);

    } catch (error) {
      console.error('Error adding person:', error);
      setSubmitStatus('error');
    }
  };

  return (
    <div className={`rounded-xl overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
      {/* Header */}
      <div className={`px-6 py-4 border-b flex items-center justify-between
        ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isDark ? 'bg-cyan-600' : 'bg-blue-600'}`}>
            <User className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              เพิ่มบุคคลใหม่
            </h3>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
              บันทึกข้อมูลผู้ต้องสงสัย/บุคคลที่เกี่ยวข้อง
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
        {/* Photo Section */}
        <div className="flex items-start gap-6">
          <div className="flex-shrink-0">
            <div className={`w-24 h-24 rounded-xl overflow-hidden border-2 
              ${isDark ? 'border-slate-600 bg-slate-700' : 'border-gray-200 bg-gray-100'}`}>
              {photoPreview ? (
                <img 
                  src={photoPreview} 
                  alt="Preview" 
                  className="w-full h-full object-cover"
                  onError={() => setPhotoPreview(generateAvatar(firstName || 'User', lastName || 'Name'))}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Camera className={`w-8 h-8 ${isDark ? 'text-slate-500' : 'text-gray-400'}`} />
                </div>
              )}
            </div>
          </div>
          
          <div className="flex-1 space-y-3">
            <div>
              <label className="form-label">URL รูปถ่าย (ไม่บังคับ)</label>
              <input
                type="url"
                placeholder="https://example.com/photo.jpg"
                className="form-input"
                onChange={(e) => handlePhotoUrlChange(e.target.value)}
              />
              <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
                หากไม่ระบุจะใช้รูป Avatar อัตโนมัติ
              </p>
            </div>
          </div>
        </div>

        {/* Name Fields */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">ชื่อจริง *</label>
            <input
              {...register('FirstName')}
              className={`form-input ${errors.FirstName ? 'border-red-500' : ''}`}
              placeholder="กรอกชื่อจริง"
            />
            {errors.FirstName && (
              <p className="form-error">{errors.FirstName.message}</p>
            )}
          </div>
          
          <div>
            <label className="form-label">นามสกุล *</label>
            <input
              {...register('LastName')}
              className={`form-input ${errors.LastName ? 'border-red-500' : ''}`}
              placeholder="กรอกนามสกุล"
            />
            {errors.LastName && (
              <p className="form-error">{errors.LastName.message}</p>
            )}
          </div>
        </div>

        {/* Alias and National ID */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">ชื่อเล่น / ฉายา</label>
            <input
              {...register('Alias')}
              className="form-input"
              placeholder="เช่น เสือใหญ่, ไอ้หนุ่ม"
            />
          </div>
          
          <div>
            <label className="form-label">เลขประจำตัวประชาชน *</label>
            <input
              {...register('NationalID')}
              className={`form-input font-mono ${
                errors.NationalID || isDuplicateId ? 'border-red-500' : ''
              }`}
              placeholder="เลข 13 หลัก"
              maxLength={13}
            />
            {errors.NationalID && (
              <p className="form-error">{errors.NationalID.message}</p>
            )}
            {isDuplicateId && (
              <p className="form-error">เลขประจำตัวประชาชนนี้มีในระบบแล้ว</p>
            )}
          </div>
        </div>

        {/* DOB, Gender */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">วันเกิด</label>
            <input
              type="date"
              {...register('DateOfBirth')}
              className="form-input"
            />
          </div>
          
          <div>
            <label className="form-label">เพศ</label>
            <select {...register('Gender')} className="form-select">
              <option value="M">ชาย</option>
              <option value="F">หญิง</option>
              <option value="O">อื่นๆ</option>
            </select>
          </div>
        </div>

        {/* Risk Level and Status */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">ระดับความเสี่ยง</label>
            <select {...register('RiskLevel')} className="form-select">
              {RISK_LEVELS.map(level => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="form-label">สถานะ *</label>
            <select {...register('Status')} className="form-select">
              {STATUS_OPTIONS.map(status => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Home Address */}
        <div>
          <label className="form-label">ที่อยู่ตามทะเบียนบ้าน</label>
          <input
            {...register('HomeAddress')}
            className="form-input"
            placeholder="กรอกที่อยู่โดยละเอียด"
          />
        </div>

        {/* Current Address */}
        <div>
          <label className="form-label">ที่อยู่ปัจจุบัน</label>
          <input
            {...register('CurrentAddress')}
            className="form-input"
            placeholder="กรอกที่อยู่ปัจจุบัน (หากแตกต่างจากทะเบียนบ้าน)"
          />
        </div>

        {/* Location Picker */}
        <div>
          <label className="form-label">พิกัดที่อยู่ (แผนที่)</label>
          <LocationPicker
            value={selectedLocation}
            onChange={setSelectedLocation}
            placeholder="คลิกบนแผนที่เพื่อระบุพิกัด"
          />
        </div>

        {/* Contacts Section */}
        <div className={`p-4 rounded-lg ${isDark ? 'bg-slate-900/50' : 'bg-gray-50'}`}>
          <div className="flex items-center justify-between mb-3">
            <label className="form-label mb-0 flex items-center gap-2">
              <Phone className="w-4 h-4" />
              ช่องทางการติดต่อ
            </label>
            <button
              type="button"
              onClick={() => appendContact({
                ContactType: 'Mobile',
                ContactValue: '',
                IsActive: true,
                Notes: ''
              })}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                ${isDark 
                  ? 'bg-cyan-600 hover:bg-cyan-500 text-white' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
            >
              <Plus className="w-3 h-3" />
              เพิ่มช่องทาง
            </button>
          </div>

          {contactFields.length === 0 ? (
            <p className={`text-sm py-4 text-center ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
              ยังไม่มีข้อมูลช่องทางติดต่อ คลิก "เพิ่มช่องทาง" เพื่อบันทึก
            </p>
          ) : (
            <div className="space-y-3">
              {contactFields.map((field, index) => (
                <div 
                  key={field.id}
                  className={`p-4 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-white border border-gray-200'}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                      ช่องทางที่ #{index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeContact(index)}
                      className="p-1.5 rounded hover:bg-red-600/20 text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="form-label text-xs">ประเภท *</label>
                      <select
                        {...register(`contacts.${index}.ContactType`)}
                        className="form-select text-sm"
                      >
                        {CONTACT_TYPES.map(type => (
                          <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="form-label text-xs">ข้อมูลติดต่อ *</label>
                      <input
                        {...register(`contacts.${index}.ContactValue`)}
                        className="form-input text-sm"
                        placeholder="เช่น 081-234-5678"
                      />
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Controller
                        name={`contacts.${index}.IsActive`}
                        control={control}
                        render={({ field }) => (
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="w-4 h-4 rounded"
                          />
                        )}
                      />
                      <label className="form-label text-xs mb-0">ใช้งานอยู่</label>
                    </div>
                    
                    <div>
                      <label className="form-label text-xs">หมายเหตุ</label>
                      <input
                        {...register(`contacts.${index}.Notes`)}
                        className="form-input text-sm"
                        placeholder="หมายเหตุเพิ่มเติม"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notes */}
        <div>
          <label className="form-label">หมายเหตุเพิ่มเติม</label>
          <textarea
            {...register('Notes')}
            className="form-input min-h-[80px]"
            placeholder="บันทึกข้อมูลเพิ่มเติม เช่น พฤติกรรม ลักษณะเฉพาะ"
          />
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
                <span>บันทึกข้อมูลบุคคลสำเร็จ!</span>
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
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
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
            disabled={isSubmitting || isDuplicateId}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium text-sm transition-colors
              ${isDark 
                ? 'bg-cyan-600 hover:bg-cyan-500 text-white disabled:bg-slate-600' 
                : 'bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400'}
              disabled:cursor-not-allowed`}
          >
            <Save className="w-4 h-4" />
            {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddPersonForm;
