'use client';

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

// Confidence badge styling
const getConfidenceBadge = (confidence) => {
  const badges = {
    'high': {
      icon: '🟢',
      label: 'HIGH',
      bgColor: '#064e3b',
      borderColor: '#10b981',
      textColor: '#6ee7b7'
    },
    'medium': {
      icon: '🟡',
      label: 'MEDIUM',
      bgColor: '#78350f',
      borderColor: '#f59e0b',
      textColor: '#fcd34d'
    },
    'low': {
      icon: '🔴',
      label: 'LOW',
      bgColor: '#7f1d1d',
      borderColor: '#ef4444',
      textColor: '#fca5a5'
    }
  };
  
  return badges[confidence] || badges['low'];
};

export default function AddItemModal({
  maxLength = 10,
  initialData = null
}) {
  const initial = {
    itemName: initialData?.itemName || "",
    itemDescription: initialData?.itemDescription || "",
    itemCondition: initialData?.itemCondition || "good",
    minBid: initialData?.minBid?.toString() || "",
    bidIncrement: initialData?.bidIncrement?.toString() || "",
    category: initialData?.category || "",
  };

  const [form, setForm] = useReducer(reducer, initial);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  
  // SerpAPI states
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [priceInfo, setPriceInfo] = useState(null);
  const [priceError, setPriceError] = useState(null);

  // Tooltip state
  const [activeTooltip, setActiveTooltip] = useState(null);

  const conditionOptions = [
    { label: "Mint (Brand New)", value: "mint" },
    { label: "Excellent (Like New)", value: "excellent" },
    { label: "Good (Slightly Used)", value: "good" },
    { label: "Fair (Noticeable Wear)", value: "fair" },
    { label: "Poor (Significant Damage)", value: "poor" }
  ];

  const handleField = (f) => (e) => {
    return setForm({ type: "FIELD", f, value: e.target.value });
  };

  const filterRule = /^image\//i;

  // Fetch categories from Supabase
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

  // Update form when initialData changes
  useEffect(() => {
    if (initialData) {
      setForm({ 
        type: "RESET", 
        value: {
          itemName: initialData.itemName || '',
          itemDescription: initialData.itemDescription || '',
          itemCondition: initialData.itemCondition || 'good',
          minBid: initialData.minBid?.toString() || '',
          bidIncrement: initialData.bidIncrement?.toString() || '',
          category: initialData.category || '',
        }
      });
    }
  }, [initialData]);

  // SerpAPI price suggestion handler
  const handleGetPriceSuggestion = async () => {
    if (!form.itemName || form.itemName.trim().length < 3) {
      setPriceError('Please enter at least 3 characters for the item name');
      return;
    }

    setLoadingPrice(true);
    setPriceError(null);
    setPriceInfo(null);

    try {
      const response = await fetch('/api/price-suggestion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemName: form.itemName,
          itemCondition: form.itemCondition,
        }),
      });

      const result = await response.json();
      
      if (result.success && result.data) {
        const { 
          suggestedMinBid, 
          suggestedBidIncrement, 
          marketValue, 
          priceRange, 
          explanation, 
          confidence,
          samplesFound,
          outliersRemoved,
          source,
          conditionAdjustment
        } = result.data;
        
        // Auto-fill form fields
        setForm({ 
          type: "FIELD", 
          f: "minBid", 
          value: suggestedMinBid.toString() 
        });
        
        setForm({ 
          type: "FIELD", 
          f: "bidIncrement", 
          value: suggestedBidIncrement.toString() 
        });

        setPriceInfo({
          marketValue,
          suggestedMinBid,
          priceRange,
          explanation,
          confidence,
          samplesFound,
          outliersRemoved,
          source,
          conditionAdjustment
        });
      } else {
        setPriceError(result.error || 'Could not fetch price data. Please enter manually.');
      }
    } catch (err) {
      console.error('Error fetching price suggestion:', err);
      setPriceError('Failed to get price suggestion. Please try again.');
    } finally {
      setLoadingPrice(false);
    }
  };

  return (
    <FieldGroup>
      <CustomInput
        type="itemName"
        required={true}
        value={form.itemName}
        onChange={handleField("itemName")}
      />

      {/* Item Condition Dropdown with Info Icon */}
      <div style={{ marginBottom: '15px', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <label style={{ fontSize: '14px', fontWeight: '500', color: '#f3f4f6' }}>
            Item Condition <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <div 
            style={{ position: 'relative', display: 'inline-block' }}
            onMouseEnter={() => setActiveTooltip('condition')}
            onMouseLeave={() => setActiveTooltip(null)}
          >
            <div
              style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                backgroundColor: '#374151',
                border: '1px solid #4b5563',
                color: '#9ca3af',
                fontSize: '12px',
                fontWeight: 'bold',
                cursor: 'help',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ?
            </div>
            
            {/* Tooltip - POSITIONED BELOW */}
            {activeTooltip === 'condition' && (
              <div style={{
                position: 'absolute',
                top: '32px',
                left: '-80px',
                backgroundColor: '#1f2937',
                border: '1px solid #4b5563',
                borderRadius: '8px',
                padding: '14px 16px',
                width: '340px',
                zIndex: 10000,
                fontSize: '12px',
                lineHeight: '1.7',
                color: '#d1d5db',
                boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                pointerEvents: 'none'
              }}>
                <div style={{ fontWeight: '700', marginBottom: '10px', color: '#f3f4f6', fontSize: '13px' }}>
                  📋 Condition Guide
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <strong style={{ color: '#10b981' }}>Mint:</strong> Brand new, unopened
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <strong style={{ color: '#06b6d4' }}>Excellent:</strong> Like new, barely used
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <strong style={{ color: '#eab308' }}>Good:</strong> Gently used, minimal wear
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <strong style={{ color: '#f97316' }}>Fair:</strong> Moderate wear visible
                </div>
                <div>
                  <strong style={{ color: '#ef4444' }}>Poor:</strong> Significant damage
                </div>
              </div>
            )}
          </div>
        </div>

        <CustomSelect
          type="itemCondition"
          label=""
          required={true}
          options={conditionOptions}
          value={form.itemCondition}
          onChange={handleField('itemCondition')}
        />
      </div>

      {/* SerpAPI Price Suggestion Button */}
      <button 
        type="button"
        onClick={handleGetPriceSuggestion}
        disabled={loadingPrice || !form.itemName || form.itemName.length < 3}
        style={{
          padding: '12px 24px',
          backgroundColor: (loadingPrice || !form.itemName || form.itemName.length < 3) ? '#9ca3af' : '#6366f1',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: (loadingPrice || !form.itemName || form.itemName.length < 3) ? 'not-allowed' : 'pointer',
          fontSize: '16px',
          fontWeight: '600',
          marginBottom: '15px',
          width: '100%',
          transition: 'background-color 0.2s'
        }}
      >
        {loadingPrice ? '🔍 Searching market...' : '💡 Get Market Price Suggestion'}
      </button>

      {/* Price Error Display */}
      {priceError && (
        <div style={{
          padding: '12px',
          backgroundColor: '#1f2937',
          border: '1px solid #ef4444',
          borderRadius: '8px',
          color: '#fca5a5',
          marginBottom: '15px',
          fontSize: '14px'
        }}>
          <div style={{ fontWeight: '600', marginBottom: '4px' }}>⚠️ {priceError}</div>
          <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '6px' }}>
            💡 Tip: Be specific (e.g., "iPhone 13 Pro 128GB", "Nike Air Max 1")
          </div>
        </div>
      )}

      {/* Price Info Display */}
      {priceInfo && (
        <div style={{
          padding: '16px',
          backgroundColor: '#1f2937',
          border: '1px solid #22c55e',
          borderRadius: '12px',
          marginBottom: '16px',
          fontSize: '14px'
        }}>
          <div style={{ 
            fontWeight: '600', 
            color: '#f3f4f6',
            marginBottom: '12px',
            fontSize: '16px'
          }}>
            💰 Market Analysis ({priceInfo.source})
          </div>
          
          <div style={{ marginBottom: '8px', color: '#d1d5db' }}>
            <strong style={{ color: '#e5e7eb' }}>Condition Adjustment:</strong> {priceInfo.conditionAdjustment}% of median
          </div>
          
          <div style={{ marginBottom: '8px', color: '#d1d5db' }}>
            <strong style={{ color: '#e5e7eb' }}>Data:</strong> {priceInfo.samplesFound} listings analyzed
            {priceInfo.outliersRemoved > 0 && (
              <span style={{ color: '#9ca3af', fontSize: '12px' }}>
                {' '}({priceInfo.outliersRemoved} outlier{priceInfo.outliersRemoved !== 1 ? 's' : ''} removed)
              </span>
            )}
          </div>
          
          <div style={{ marginBottom: '8px', color: '#d1d5db' }}>
            <strong style={{ color: '#e5e7eb' }}>Price Range:</strong> ${priceInfo.priceRange.min} - ${priceInfo.priceRange.max}
          </div>
          
          <div style={{ marginBottom: '8px', color: '#d1d5db' }}>
            <strong style={{ color: '#e5e7eb' }}>Median Price:</strong> ${priceInfo.priceRange.median}
          </div>
          
          <div style={{ marginBottom: '12px', color: '#d1d5db' }}>
            <strong style={{ color: '#22c55e' }}>Suggested Start:</strong> ${priceInfo.suggestedMinBid}
          </div>

          {/* Confidence Badge with Icon */}
          <div style={{ marginBottom: '12px' }}>
            {(() => {
              const badge = getConfidenceBadge(priceInfo.confidence);
              return (
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: badge.bgColor,
                  border: `2px solid ${badge.borderColor}`,
                  borderRadius: '20px',
                  padding: '6px 14px',
                  fontSize: '13px',
                  fontWeight: '700',
                  color: badge.textColor
                }}>
                  <span style={{ fontSize: '16px' }}>{badge.icon}</span>
                  {badge.label}
                </div>
              );
            })()}
          </div>
          
          <div style={{ 
            fontSize: '13px', 
            color: '#c4b5fd', 
            fontStyle: 'italic',
            lineHeight: '1.5',
            paddingTop: '12px',
            borderTop: '1px solid #374151',
            marginBottom: '12px'
          }}>
            {priceInfo.explanation}
          </div>

          {/* Info Box: How Min Bid is Calculated */}
          <div style={{
            backgroundColor: '#111827',
            border: '1px solid #3b82f6',
            borderRadius: '6px',
            padding: '10px',
            marginBottom: '10px',
            fontSize: '12px',
            color: '#d1d5db'
          }}>
            <div style={{ fontWeight: '600', color: '#60a5fa', marginBottom: '6px' }}>
              📊 Min Bid Calculation:
            </div>
            <div style={{ lineHeight: '1.6', color: '#9ca3af' }}>
              Median Price: ${priceInfo.priceRange.median} × 75% × {priceInfo.conditionAdjustment}% = <strong style={{ color: '#10b981' }}>${priceInfo.suggestedMinBid}</strong>
            </div>
            <div style={{ fontSize: '11px', marginTop: '6px', color: '#6b7280' }}>
              Starting at 75% of median attracts bidders while maximizing final price
            </div>
          </div>

          {/* Info Box: How Bid Increment is Calculated */}
          <div style={{
            backgroundColor: '#111827',
            border: '1px solid #f59e0b',
            borderRadius: '6px',
            padding: '10px',
            fontSize: '12px',
            color: '#d1d5db'
          }}>
            <div style={{ fontWeight: '600', color: '#fbbf24', marginBottom: '6px' }}>
              📈 Bid Increment Calculation:
            </div>
            <div style={{ lineHeight: '1.6', color: '#9ca3af' }}>
              Min Bid: ${priceInfo.suggestedMinBid} × 5% = <strong style={{ color: '#f59e0b' }}>${priceInfo.suggestedMinBid * 0.05 < 1 ? 1 : Math.round(priceInfo.suggestedMinBid * 0.05)}</strong>
            </div>
            <div style={{ fontSize: '11px', marginTop: '6px', color: '#6b7280' }}>
              Each bid must increase by at least this amount
            </div>
          </div>
        </div>
      )}
      
      <CustomTextarea
        type="itemDescription"
        label="Item Description"
        placeholder="Briefly describe the item..."
        value={form.itemDescription}
        onChange={handleField("itemDescription")}
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
