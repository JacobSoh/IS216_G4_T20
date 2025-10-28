'use client';

import React, { useReducer, useEffect } from 'react';
import { CustomInput } from '@/components/Form/CustomInput';
import { CustomFileInput } from '@/components/Form/CustomFileInput';
import { FieldGroup } from '@/components/ui/field';

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
    itemName: initialData?.itemName || '',
    minBid: initialData?.minBid?.toString() || '',
    bidIncrement: initialData?.bidIncrement?.toString() || '',
  };

  const [form, setForm] = useReducer(reducer, initial);
  
  useEffect(() => {
    if (initialData) {
      setForm({ 
        type: "RESET", 
        value: {
          itemName: initialData.itemName || '',
          minBid: initialData.minBid?.toString() || '',
          bidIncrement: initialData.bidIncrement?.toString() || '',
        }
      });
    }
  }, [initialData]);

  const handleField = (f) => (e) => {
    return setForm({ type: "FIELD", f, value: e.target.value });
  };

  const filterRule = /^image\//i;

  return (
    <FieldGroup>
      <CustomInput
        type="itemName"
        required={true}
        value={form.itemName}
        onChange={handleField}
      />
      <CustomInput
        type="minBid"
        required={true}
        value={form.minBid}
        onChange={handleField}
      />
      <CustomInput
        type="bidIncrement"
        value={form.bidIncrement}
        onChange={handleField}
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
