import { useRef, useState, useEffect, useReducer } from 'react';
import { useModal } from '@/context/ModalContext';
import { Button } from '@/components/ui/button';

import { Plus } from 'lucide-react';
import { FieldGroup } from '@/components/ui/field';
import { CustomInput } from '@/components/Form/CustomInput';
import { CustomFileInput } from '@/components/Form/CustomFileInput';
import { CustomerDatePicker } from '@/components/Form/CustomDatePicker';
import { CustomTextarea } from '@/components/Form/CustomTextarea';

const intial = {
  auctionName: "",
  auctionDescription: "",
  startDateTime: new Date(Date.now()),
  endDateTime: new Date(Date.now()),
};

function reducer(s, a) {
  switch (a.type) {
    case "FIELD":
      return { ...s, [a.f]: a.value };
    case "RESET":
      return a.value;
    default:
      return s;
  };
};

export default function AuctionCreateForm({
  onSubmit
}) {
  const { setModalHeader, setModalState, setModalForm } = useModal();
  const [showLoading, setShowLoading] = useState(false);

  const handleField = (f) => (e) => {
    return setForm({ type: "FIELD", f, value: e.target.value });
  };

  const filterRule = /^image\//i;

  return (
    <form id="auctionCreate" onSubmit={onSubmit}>
      <FieldGroup>
        {/* Grid layout with proper alignment */}
        <div className='grid lg:grid-cols-2 gap-6 items-start'>
          {/* Left Column - Form Fields */}
          <FieldGroup className="flex flex-col gap-4">
            <CustomInput
              type='auctionName'
              required={true}
            />
            <CustomTextarea
              type="auctionDescription"
              required={true}
            />
            <div className='grid grid-cols-2 gap-4'>
              <CustomerDatePicker
                type="startDateTime"
                required={true}
              />
              <CustomerDatePicker
                type="endDateTime"
                required={true}
              />
            </div>
          </FieldGroup>

          {/* Right Column - File Upload */}
          <FieldGroup>
            <CustomFileInput
              type="auctionFile"
              label="Upload Auction Image"
              filterRule={filterRule}
              maxLength={1}
              required={true}
            />
          </FieldGroup>
        </div>
      </FieldGroup>
    </form>
  );
}
