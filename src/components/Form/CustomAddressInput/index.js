// Address autocomplete with API parity similar to CustomInput
'use client';

import { useEffect, useId, useRef, useState, useCallback } from 'react';
// Avoid @googlemaps/js-api-loader; load script directly to keep compatibility
import { Field, FieldLabel, FieldError } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

export function CustomAddressInput({
  name = 'address',
  label = 'Address',
  placeholder = 'Search address',
  id: idProp,
  value: valueProp,
  onChange: onChangeProp,
  defaultValue,
  required,
  err,
  onSelect, // optional: full Google place details callback
  ...rest
}) {
  const autoId = useId();
  const id = idProp ?? `fi-${name}-${autoId}`;

  const inputRef = useRef(null);
  const sessionTokenRef = useRef();
  const [preds, setPreds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [innerValue, setInnerValue] = useState(defaultValue ?? '');

  const isControlled = valueProp !== undefined;
  const value = isControlled ? valueProp : innerValue;

  // Lazy loader for Google Maps JS API (Places)
  const loadGooglePlaces = useCallback(() => {
    if (typeof window === 'undefined') return Promise.resolve(null);
    if (window.google?.maps?.places) return Promise.resolve(window.google);
    if (window.__gmapsPlacesPromise) return window.__gmapsPlacesPromise;
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY;
    if (!key) {
      return Promise.reject(new Error('Missing NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY'));
    }
    window.__gmapsPlacesPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      const params = new URLSearchParams({ key, libraries: 'places', v: 'weekly' });
      script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve(window.google);
      script.onerror = () => reject(new Error('Failed to load Google Maps JS API'));
      document.head.appendChild(script);
    });
    return window.__gmapsPlacesPromise;
  }, []);

  useEffect(() => {
    try {
      // Only create token when google is available; ignore SSR
      loadGooglePlaces().then((googleObj) => {
        if (
          googleObj &&
          googleObj.maps &&
          googleObj.maps.places &&
          typeof googleObj.maps.places.AutocompleteSessionToken === 'function'
        ) {
          sessionTokenRef.current = new googleObj.maps.places.AutocompleteSessionToken();
        }
      }).catch(() => {});
    } catch {}
  }, [loadGooglePlaces]);

  // Normalize onChange function to support either curried or direct handlers
  const callOnChange = (e) => {
    if (typeof onChangeProp !== 'function') return;
    try {
      const maybe = onChangeProp(name);
      if (typeof maybe === 'function') return maybe(e);
      return onChangeProp(e);
    } catch {
      try { onChangeProp(e); } catch {}
    }
  };

  async function handleInputChange(e) {
    const input = e.target.value;
    if (!isControlled) setInnerValue(input);
    callOnChange(e);

    if (!input) { setPreds([]); return; }

    setLoading(true);
    const googleObj = await loadGooglePlaces();
    const svc = new googleObj.maps.places.AutocompleteService();
    svc.getPlacePredictions(
      {
        input,
        types: ['address'],
        sessionToken: sessionTokenRef.current,
      },
      (results) => {
        setPreds(results ?? []);
        setLoading(false);
      }
    );
  }

  async function pickPrediction(p) {
    const googleObj = await loadGooglePlaces();
    const details = new googleObj.maps.places.PlacesService(document.createElement('div'));
    details.getDetails(
      { placeId: p.place_id, fields: ['formatted_address', 'geometry', 'address_components'] },
      (place) => {
        const address = place?.formatted_address || p.description;
        const synthetic = { target: { name, value: address } };
        if (!isControlled) setInnerValue(address);
        callOnChange(synthetic);
        onSelect?.(place ?? { description: p.description });
        setPreds([]);
      }
    );
  }

  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div className="relative">
        <Input
          id={id}
          name={name}
          placeholder={placeholder}
          required={required}
          value={value}
          onChange={handleInputChange}
          ref={inputRef}
          autoComplete="off"
          {...rest}
        />
        {loading && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">Searching…</div>
        )}
        {preds.length > 0 && (
          <ul className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md ring-1 ring-[var(--theme-secondary)] bg-background">
            {preds.map((p) => (
              <li
                key={p.place_id}
                className="cursor-pointer px-3 py-2 text-sm hover:text-[var(--background)] hover:bg-white"
                onClick={() => pickPrediction(p)}
              >
                {p.description}
              </li>
            ))}
          </ul>
        )}
      </div>
      <FieldError>{err}</FieldError>
    </Field>
  );
}
