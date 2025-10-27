// 'use client';

// import { useState, useReducer, useEffect } from 'react';
// import { supabaseBrowser } from '@/utils/supabase/client';

// const initial = {
//     firstName: '',
//     middleName: '',
//     lastName: '',
//     street: '',
//     city: '',
//     state: '',
//     zip: '',
//     username: '',
// };

// function reducer(state, action) {
//     switch (action.type) {
//         case "FIELD":
//             return { ...state, [action.field]: action.value };
//         case "RESET":
//             return initialForm;
//         default:
//             return state;
//     };
// };

// export default function Settings({ isOpen, onClose, userId, currentData }) {
//     const [form, dispatch] = useReducer(reducer, initial);
//     // const [formData, setFormData] = useState();
//     const [loading, setLoading] = useState(false);
//     const [error, setError] = useState(null);
//     const [success, setSuccess] = useState(false);
//     const [avatarFile, setAvatarFile] = useState(null);
//     const [avatarPreview, setAvatarPreview] = useState('');
//     const supabase = supabaseBrowser();

//     const handleField =
//         (field) =>
//             (e) =>
//                 dispatch({ type: "FIELD", field, value: e.target.value });

//     useEffect(() => {
//         if (isOpen && currentData) {
//             setFormData({
//                 firstName: currentData.first_name || '',
//                 middleName: currentData.middle_name || '',
//                 lastName: currentData.last_name || '',
//                 street: currentData.street || '',
//                 city: currentData.city || '',
//                 state: currentData.state || '',
//                 zip: currentData.zip || '',
//                 username: currentData.username || '',
//             });
//             if (currentData.object_path) {
//                 setAvatarPreview(`https://teiunfcrodktaevlilhm.supabase.co/storage/v1/object/public/avatar/${currentData.object_path}`);
//             };
//         }
//     }, [isOpen, currentData]);

//     const handleChange = (e) => dispatch({ type: '' })
//         setFormData({
//             ...formData,
//             [e.target.name]: e.target.value
//         });
//     };

//     const handleAvatarChange = (e) => {
//         const file = e.target.files[0];
//         if (file) {
//             // Validate file type
//             if (!file.type.startsWith('image/')) {
//                 setError('Please select a valid image file');
//                 return;
//             }
//             // Validate file size (max 5MB)
//             if (file.size > 5 * 1024 * 1024) {
//                 setError('Image size should be less than 5MB');
//                 return;
//             }
//             setAvatarFile(file);
//             setAvatarPreview(URL.createObjectURL(file));
//             setError(null);
//         }
//     };

//     const handleSave = async () => {
//         setLoading(true);
//         setError(null);
//         setSuccess(false);

//         try {
//             let objectPath = currentData?.object_path;

//             // Upload new avatar if selected
//             if (avatarFile) {
//                 const fileExt = avatarFile.name.split('.').pop();
//                 const fileName = `${userId}-${Date.now()}.${fileExt}`;

//                 // Delete old avatar if exists
//                 if (currentData?.object_path) {
//                     await supabase.storage
//                         .from('avatar')
//                         .remove([currentData.object_path]);
//                 }

//                 const { data: uploadData, error: uploadError } = await supabase.storage
//                     .from('avatar')
//                     .upload(fileName, avatarFile, {
//                         cacheControl: '3600',
//                         upsert: false
//                     });

//                 if (uploadError) {
//                     console.error('Upload error:', uploadError);
//                     throw new Error(`Upload failed: ${uploadError.message}`);
//                 }

//                 objectPath = fileName;
//             }

//             // Update profile in database
//             const { error: updateError } = await supabase
//                 .from('profile')
//                 .update({
//                     first_name: formData.firstName,
//                     middle_name: formData.middleName,
//                     last_name: formData.lastName,
//                     street: formData.street,
//                     city: formData.city,
//                     state: formData.state,
//                     zip: formData.zip,
//                     username: formData.username,
//                     object_path: objectPath
//                 })
//                 .eq('id', userId);

//             if (updateError) {
//                 console.error('Update error:', updateError);
//                 throw new Error(`Update failed: ${updateError.message}`);
//             }

//             setSuccess(true);
//             setTimeout(() => {
//                 onClose();
//                 window.location.reload();
//             }, 1500);
//         } catch (err) {
//             setError(err.message);
//         } finally {
//             setLoading(false);
//         }
//     };

//     const handleDiscard = () => {
//         setFormData({
//             firstName: currentData?.first_name || '',
//             middleName: currentData?.middle_name || '',
//             lastName: currentData?.last_name || '',
//             street: currentData?.street || '',
//             city: currentData?.city || '',
//             state: currentData?.state || '',
//             zip: currentData?.zip || '',
//             username: currentData?.username || '',
//         });
//         setAvatarFile(null);
//         if (currentData?.object_path) {
//             setAvatarPreview(`https://teiunfcrodktaevlilhm.supabase.co/storage/v1/object/public/avatar/${currentData.object_path}`);
//         } else {
//             setAvatarPreview('');
//         }
//         setError(null);
//         setSuccess(false);
//         onClose();
//     };

//     if (!isOpen) return null;

//     return (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4 overflow-y-auto">
//             <div className="bg-gray-800 rounded-md shadow-2xl w-full max-w-2xl my-8 border border-gray-700">
//                 {/* Header - Fixed */}
//                 <div className="bg-gray-800 border-b border-gray-700 p-6 flex items-center justify-between rounded-t-2xl">
//                     <h2 className="text-2xl font-bold text-white">Profile Settings</h2>
//                     <button
//                         onClick={handleDiscard}
//                         className="text-gray-400 hover:text-white transition"
//                     >
//                         <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//                         </svg>
//                     </button>
//                 </div>

//                 {/* Body - Scrollable */}
//                 <div className="p-6 space-y-6 max-h-[calc(90vh-200px)] overflow-y-auto">
//                     {/* Avatar Upload - Fixed positioning */}
//                     <div className="flex flex-col items-center gap-4">
//                         <div className="relative w-24 h-24 flex-shrink-0">
//                             <img
//                                 src={avatarPreview || '/default-avatar.jpg'}
//                                 alt="Avatar Preview"
//                                 className="w-24 h-24 rounded-full object-cover ring-4 ring-gray-600"
//                             />
//                         </div>
//                         <label className="cursor-pointer bg-gray-700 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition">
//                             <input
//                                 type="file"
//                                 accept="image/*"
//                                 onChange={handleAvatarChange}
//                                 className="hidden"
//                             />
//                             Change Avatar
//                         </label>
//                     </div>

//                     {/* Form Fields */}
//                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                         <div>
//                             <label className="block text-sm font-medium text-gray-300 mb-2">
//                                 Username *
//                             </label>
//                             <input
//                                 type="text"
//                                 name="username"
//                                 value={formData.username}
//                                 onChange={handleChange}
//                                 required
//                                 className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                             />
//                         </div>

//                         <div>
//                             <label className="block text-sm font-medium text-gray-300 mb-2">
//                                 First Name
//                             </label>
//                             <input
//                                 type="text"
//                                 name="firstName"
//                                 value={formData.firstName}
//                                 onChange={handleChange}
//                                 className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                             />
//                         </div>

//                         <div>
//                             <label className="block text-sm font-medium text-gray-300 mb-2">
//                                 Middle Name
//                             </label>
//                             <input
//                                 type="text"
//                                 name="middleName"
//                                 value={formData.middleName}
//                                 onChange={handleChange}
//                                 className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                             />
//                         </div>

//                         <div>
//                             <label className="block text-sm font-medium text-gray-300 mb-2">
//                                 Last Name
//                             </label>
//                             <input
//                                 type="text"
//                                 name="lastName"
//                                 value={formData.lastName}
//                                 onChange={handleChange}
//                                 className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                             />
//                         </div>
//                     </div>

//                     <div>
//                         <label className="block text-sm font-medium text-gray-300 mb-2">
//                             Street Address
//                         </label>
//                         <input
//                             type="text"
//                             name="street"
//                             value={formData.street}
//                             onChange={handleChange}
//                             className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                         />
//                     </div>

//                     <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
//                         <div>
//                             <label className="block text-sm font-medium text-gray-300 mb-2">
//                                 City
//                             </label>
//                             <input
//                                 type="text"
//                                 name="city"
//                                 value={formData.city}
//                                 onChange={handleChange}
//                                 className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                             />
//                         </div>

//                         <div>
//                             <label className="block text-sm font-medium text-gray-300 mb-2">
//                                 State
//                             </label>
//                             <input
//                                 type="text"
//                                 name="state"
//                                 value={formData.state}
//                                 onChange={handleChange}
//                                 className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                             />
//                         </div>

//                         <div>
//                             <label className="block text-sm font-medium text-gray-300 mb-2">
//                                 ZIP Code
//                             </label>
//                             <input
//                                 type="text"
//                                 name="zip"
//                                 value={formData.zip}
//                                 onChange={handleChange}
//                                 className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                             />
//                         </div>
//                     </div>

//                     {/* Error Message */}
//                     {error && (
//                         <div className="bg-red-900/30 border border-red-500 text-red-400 px-4 py-3 rounded-md">
//                             {error}
//                         </div>
//                     )}

//                     {/* Success Message */}
//                     {success && (
//                         <div className="bg-green-900/30 border border-green-500 text-green-400 px-4 py-3 rounded-md">
//                             Profile updated successfully!
//                         </div>
//                     )}
//                 </div>

//                 {/* Footer - Fixed */}
//                 <div className="bg-gray-800 border-t border-gray-700 p-6 flex flex-col sm:flex-row gap-3 rounded-b-2xl">
//                     <button
//                         onClick={handleDiscard}
//                         disabled={loading}
//                         className="flex-1 px-6 py-3 bg-gray-700 text-white rounded-md font-semibold hover:bg-gray-600 transition disabled:opacity-50"
//                     >
//                         Discard
//                     </button>
//                     <button
//                         onClick={handleSave}
//                         disabled={loading}
//                         className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-500 transition disabled:opacity-50"
//                     >
//                         {loading ? 'Saving...' : 'Save Changes'}
//                     </button>
//                 </div>
//             </div>
//         </div>
//     );
// }
