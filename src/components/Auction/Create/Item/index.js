import { useRef, useState, useEffect, useReducer } from 'react';
import { CustomInput } from '@/components/Form/CustomInput';
import { CustomTextarea } from '@/components/Form/CustomTextarea';
import { CustomSelect } from '@/components/Form/CustomSelect';
import { CustomFileInput } from '@/components/Form/CustomFileInput';
import { FieldGroup } from '@/components/ui/field';
import { createClient } from '@/lib/supabase/client';

const reducer = (s, a) => {
  switch (a.type) {
    case "FIELD": return { ...s, [a.f]: a.value };
    case "RESET": return a.value;
    default: return s;
  }
};

export default function AddItemModal({
  maxLength = 10,
  initialData = null
}) {
  const initial = {
    itemName: initialData?.itemName || "",
    itemDescription: initialData?.itemDescription || "",
    minBid: initialData?.minBid?.toString() || "",
    bidIncrement: initialData?.bidIncrement?.toString() || "",
    category: initialData?.category || "",
  };

  const [form, setForm] = useReducer(reducer, initial);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const handleField = (f) => (e) => {
    return setForm({ type: "FIELD", f, value: e.target.value });
  };

  const filterRule = /^image\//i;

  useEffect(() => {
    async function fetchCategories() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('category')
          .select('category_name')
          .order('category_name');

        if (error) {
          console.error('Error fetching categories:', error);
          return;
        }

        const categoryOptions = data.map(cat => ({
          label: cat.category_name,
          value: cat.category_name
        }));

        setCategories(categoryOptions);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoadingCategories(false);
      }
    }

    fetchCategories();
  }, []);

  useEffect(() => {
    if (initialData) {
      setForm({ 
        type: "RESET", 
        value: {
          itemName: initialData.itemName || '',
          itemDescription: initialData.itemDescription || '',
          minBid: initialData.minBid?.toString() || '',
          bidIncrement: initialData.bidIncrement?.toString() || '',
          category: initialData.category || '',
        }
      });
    }
  }, [initialData]);

  return (
    <FieldGroup>
      <CustomInput
        type="itemName"
        required={true}
        value={form.itemName}
        onChange={handleField("itemName")}
      />
      
      <CustomTextarea
        type="itemDescription"
        label="Item Description"
        placeholder="Briefly describe the item..."
        value={form.itemDescription}
        onChange={handleField("itemDescription")}  // ✅ Fixed
        required={false}
      />
      
      <CustomInput
        type="minBid"
        required={true}
        value={form.minBid}
        onChange={handleField("minBid")}
      />
      <CustomInput
        type="bidIncrement"
        value={form.bidIncrement}
        onChange={handleField("bidIncrement")}
      />
      
      <CustomSelect
        type="category"
        label="Item Category"
        required={true}
        placeholder={loadingCategories ? "Loading categories..." : "Select a category"}
        options={categories}
        value={form.category}
        onChange={handleField('category')}
        disabled={loadingCategories}
      />

      <CustomFileInput
        type="itemFile"
        label="Upload Item Images"
        filterRule={filterRule}
        required={!initialData}
        maxLength={maxLength}
        existingFiles={initialData?.filePreviews}
      />
    </FieldGroup>
  );
}


// import { useRef, useState, useEffect, useReducer } from 'react';
// import { CustomInput } from '@/components/Form/CustomInput';
// import { CustomTextarea } from '@/components/Form/CustomTextarea'; // Add this import
// import { CustomSelect } from '@/components/Form/CustomSelect';
// import { CustomFileInput } from '@/components/Form/CustomFileInput';
// import { FieldGroup } from '@/components/ui/field';
// import { createClient } from '@/lib/supabase/client';

// const reducer = (s, a) => {
//   switch (a.type) {
//     case "FIELD": return { ...s, [a.f]: a.value };
//     case "RESET": return a.value;
//     default: return s;
//   }
// };

// export default function AddItemModal({
//   maxLength = 10,
//   initialData = null
// }) {
//   const initial = {
//     itemName: initialData?.itemName || "",
//     itemDescription: initialData?.itemDescription || "", // Add this
//     minBid: initialData?.minBid?.toString() || "",
//     bidIncrement: initialData?.bidIncrement?.toString() || "",
//     category: initialData?.category || "",
//   };

//   const [form, setForm] = useReducer(reducer, initial);
//   const [categories, setCategories] = useState([]);
//   const [loadingCategories, setLoadingCategories] = useState(true);

//   const handleField = (f) => (e) => {
//     return setForm({ type: "FIELD", f, value: e.target.value });
//   };

//   const filterRule = /^image\//i;

//   useEffect(() => {
//     async function fetchCategories() {
//       try {
//         const supabase = createClient();
//         const { data, error } = await supabase
//           .from('category')
//           .select('category_name')
//           .order('category_name');

//         if (error) {
//           console.error('Error fetching categories:', error);
//           return;
//         }

//         const categoryOptions = data.map(cat => ({
//           label: cat.category_name,
//           value: cat.category_name
//         }));

//         setCategories(categoryOptions);
//       } catch (error) {
//         console.error('Error:', error);
//       } finally {
//         setLoadingCategories(false);
//       }
//     }

//     fetchCategories();
//   }, []);

//   useEffect(() => {
//     if (initialData) {
//       setForm({ 
//         type: "RESET", 
//         value: {
//           itemName: initialData.itemName || '',
//           itemDescription: initialData.itemDescription || '', // Add this
//           minBid: initialData.minBid?.toString() || '',
//           bidIncrement: initialData.bidIncrement?.toString() || '',
//           category: initialData.category || '',
//         }
//       });
//     }
//   }, [initialData]);

//   return (
//     <FieldGroup>
//       <CustomInput
//         type="itemName"
//         required={true}
//         value={form.itemName}
//         onChange={handleField}
//       />
      
//       {/* NEW: Item Description field */}
//       <CustomTextarea
//         type="itemDescription"
//         label="Item Description"
//         placeholder="Briefly describe the item..."
//         value={form.itemDescription}
//         onChange={handleField}
//         required={false}
//       />
      
//       <CustomInput
//         type="minBid"
//         required={true}
//         value={form.minBid}
//         onChange={handleField}
//       />
//       <CustomInput
//         type="bidIncrement"
//         value={form.bidIncrement}
//         onChange={handleField}
//       />
      
//       <CustomSelect
//         type="category"
//         label="Item Category"
//         required={true}
//         placeholder={loadingCategories ? "Loading categories..." : "Select a category"}
//         options={categories}
//         value={form.category}
//         onChange={handleField('category')}
//         disabled={loadingCategories}
//       />

//       <CustomFileInput
//         type="itemFile"
//         label="Upload Item Images"
//         filterRule={filterRule}
//         required={!initialData}
//         maxLength={maxLength}
//         existingFiles={initialData?.filePreviews}
//       />
//     </FieldGroup>
//   );
// }


// 'use client';

// import { useRef, useState, useEffect, useReducer } from 'react';
// import { CustomInput } from '@/components/Form/CustomInput';
// import { CustomSelect } from '@/components/Form/CustomSelect';
// import { CustomFileInput } from '@/components/Form/CustomFileInput';
// import { FieldGroup } from '@/components/ui/field';
// import { createClient } from '@/lib/supabase/client';

// const reducer = (s, a) => {
//   switch (a.type) {
//     case "FIELD": return { ...s, [a.f]: a.value };
//     case "RESET": return a.value;
//     default: return s;
//   }
// };

// export default function AddItemModal({
//   maxLength = 10,
//   initialData = null  // Accept initialData for editing
// }) {
//   // Initialize with existing data if editing
//   const initial = {
//     itemName: initialData?.itemName || "",
//     minBid: initialData?.minBid?.toString() || "",
//     bidIncrement: initialData?.bidIncrement?.toString() || "",
//     category: initialData?.category || "",
//   };

//   const [form, setForm] = useReducer(reducer, initial);
//   const [categories, setCategories] = useState([]);
//   const [loadingCategories, setLoadingCategories] = useState(true);

//   const handleField = (f) => (e) => {
//     return setForm({ type: "FIELD", f, value: e.target.value });
//   };

//   const filterRule = /^image\//i;

//   // Fetch categories from Supabase
//   useEffect(() => {
//     async function fetchCategories() {
//       try {
//         const supabase = createClient();
//         const { data, error } = await supabase
//           .from('category')
//           .select('category_name')
//           .order('category_name');

//         if (error) {
//           console.error('Error fetching categories:', error);
//           return;
//         }

//         const categoryOptions = data.map(cat => ({
//           label: cat.category_name,
//           value: cat.category_name
//         }));

//         setCategories(categoryOptions);
//       } catch (error) {
//         console.error('Error:', error);
//       } finally {
//         setLoadingCategories(false);
//       }
//     }

//     fetchCategories();
//   }, []);

//   // Update form when initialData changes (for edit mode)
//   useEffect(() => {
//     if (initialData) {
//       setForm({ 
//         type: "RESET", 
//         value: {
//           itemName: initialData.itemName || '',
//           minBid: initialData.minBid?.toString() || '',
//           bidIncrement: initialData.bidIncrement?.toString() || '',
//           category: initialData.category || '',
//         }
//       });
//     }
//   }, [initialData]);

//   return (
//     <FieldGroup>
//       <CustomInput
//         type="itemName"
//         required={true}
//         value={form.itemName}
//         onChange={handleField}
//       />
//       <CustomInput
//         type="minBid"
//         required={true}
//         value={form.minBid}
//         onChange={handleField}
//       />
//       <CustomInput
//         type="bidIncrement"
//         value={form.bidIncrement}
//         onChange={handleField}
//       />
      
//       {/* Category Dropdown */}
//       <CustomSelect
//         type="category"
//         label="Item Category"
//         required={true}
//         placeholder={loadingCategories ? "Loading categories..." : "Select a category"}
//         options={categories}
//         value={form.category}
//         onChange={handleField('category')}
//         disabled={loadingCategories}
//       />

//       <CustomFileInput
//         type="itemFile"
//         label="Upload Item Images"
//         filterRule={filterRule}
//         required={!initialData}  // Not required when editing
//         maxLength={maxLength}
//         existingFiles={initialData?.filePreviews}  // Show existing images
//       />
//     </FieldGroup>
//   );
// }


