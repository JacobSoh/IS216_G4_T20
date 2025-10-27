'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { PieChart } from '@mui/x-charts/PieChart';
import { supabaseBrowser } from '@/utils/supabase/client';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  CircularProgress,
  useMediaQuery
} from '@mui/material';

function valueFormatter(value) {
  return `${value} items`;
}

export default function CategoriesPie({ userId }) {
  const sb = supabaseBrowser();
  const currentYear = new Date().getFullYear();
  const isMobile = useMediaQuery('(max-width: 640px)'); // Move hook to top level
  const [categoriesAuctioned, setCategoriesAuctioned] = useState([]);
  const [selectedYear, setSelectedYear] = useState('all');
  const [availableYears, setAvailableYears] = useState([currentYear]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSignupYear = async () => {
      try {
        const { data, error } = await sb
          .from('profile')
          .select('created_at')
          .eq('id', userId)
          .single();

        if (error) {
          console.error('Error fetching signup year:', error);
          return;
        }

        const signupDate = new Date(data.created_at);
        const signupYear = signupDate.getFullYear();

        // Generate array of years from signup to current year
        const years = [];
        for (let year = signupYear; year <= currentYear; year++) {
          years.push(year);
        }
        setAvailableYears(years);
      } catch (error) {
        console.error('Error:', error);
      }
    };

    if (userId) {
      fetchSignupYear();
    }
  }, [userId, currentYear, sb]);

  useEffect(() => {
    const fetchCategoryData = async () => {
      if (!userId) return;

      try {
        setLoading(true);

        let query = sb
          .from('item')
          .select(`
            iid,
            item_category(category_name),
            auction!inner(start_time)
          `)
          .eq('oid', userId);

        // Filter by year if not "all"
        if (selectedYear !== 'all') {
          query = query
            .gte('auction.start_time', `${selectedYear}-01-01`)
            .lte('auction.start_time', `${selectedYear}-12-31`);
        }

        const { data, error } = await query;

        if (error) {
          console.error('Error fetching category data:', error);
          setCategoriesAuctioned([]);
          setLoading(false);
          return;
        }

        console.log('Fetched data:', JSON.stringify(data, null, 2));

        // Count items by category
        const categoryCount = {};
        data?.forEach(item => {
          // item_category is an ARRAY of objects, each with category_name
          if (Array.isArray(item.item_category)) {
            item.item_category.forEach(cat => {
              const categoryName = cat.category_name;
              if (categoryName) {
                categoryCount[categoryName] = (categoryCount[categoryName] || 0) + 1;
              }
            });
          }
        });

        console.log('Category count:', categoryCount);

        // Convert to array format for PieChart
        const categoryData = Object.entries(categoryCount).map(([label, value], index) => ({
          id: index,
          label,
          value
        }));

        console.log('Category data:', categoryData);

        setCategoriesAuctioned(categoryData);
        setLoading(false);
      } catch (error) {
        console.error('Error:', error);
        setLoading(false);
      }
    };

    fetchCategoryData();
  }, [userId, selectedYear, sb]);

  const handleYearChange = (event) => {
    setSelectedYear(event.target.value);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      {/* Title and Year Selector */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2, justifyContent: 'space-between' }}>
        <Typography variant="h6" component="h3" sx={{ fontWeight: 600, color: 'black' }}>
          Categories Distribution
        </Typography>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel id="year-select-label">Year</InputLabel>
          <Select
            labelId="year-select-label"
            id="year-select"
            value={selectedYear}
            label="Year"
            onChange={handleYearChange}
          >
            <MenuItem value="all">All</MenuItem>
            {availableYears.map((year) => (
              <MenuItem key={year} value={year}>
                {year}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Pie Chart */}
      <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
        {categoriesAuctioned.length === 0 ? (
          <Typography variant="body1" color="text.secondary" sx={{ py: 4, color: 'black' }}>
            No data available for {selectedYear === 'all' ? 'any year' : selectedYear}
          </Typography>
        ) : (
          <PieChart
            series={[
              {
                data: categoriesAuctioned,
                highlightScope: { fade: 'global', highlight: 'item' },
                faded: { innerRadius: 30, additionalRadius: -30, color: 'gray' },
                valueFormatter,
              },
            ]}
            slotProps={{
              legend: { hidden: isMobile }
            }}
            height={400}
          />
        )}
      </Box>
    </Box>
  );
}
