import React from 'react';
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

export default function AuctionCreateForm({ onSubmit, initialData }) {
  return (
    <FieldGroup>
      <div className='grid lg:grid-cols-2 gap-6 items-start'>
        <FieldGroup className="flex flex-col gap-4">
          {/* Make sure name="auctionName" */}
          <CustomInput
            type='auctionName'
            required={true}
            defaultValue={initialData?.auctionName ?? ''}
          />

          {/* Make sure name="auctionDescription" */}
          <CustomTextarea
            type="auctionDescription"
            required={true}
            defaultValue={initialData?.auctionDescription ?? ''}
          />
          
          {/* FIXED: Now fully responsive - stacks on mobile */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <CustomerDatePicker
              type="startDateTime"
              required={true}
              defaultValue={initialData?.startDateTime}
            />
            <CustomInput
              type='timeInterval'
              min={1}
              required={true}
              defaultValue={
                initialData?.timeIntervalMinutes !== undefined
                  ? initialData.timeIntervalMinutes
                  : 1
              }
            />
          </div>
        </FieldGroup>

        <FieldGroup>
          {/* Make sure name="auctionFile" */}
          <CustomFileInput
            type="auctionFile"
            label="Upload Auction Image"
            filterRule={/^image\//i}
            maxLength={1}
            required={true}
            existingFiles={initialData?.existingFiles ?? null}
          />
        </FieldGroup>
      </div>
    </FieldGroup>
  );
}
