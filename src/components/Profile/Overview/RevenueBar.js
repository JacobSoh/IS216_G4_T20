'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { BarChart } from '@mui/x-charts/BarChart';
import { supabaseBrowser } from '@/utils/supabase/client';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  CircularProgress
} from '@mui/material';

function valueFormatter(value) {
  return `$${value?.toFixed(2) || 0}`;
}

const chartSetting = {
  xAxis: [
    {
      label: 'Revenue ($)',
    },
  ],
  height: 400,
  margin: 0,
};

export default function RevenueBar({ userId }) {
  const sb = supabaseBrowser();
  const currentYear = new Date().getFullYear();
  const [dataset, setDataset] = useState([]);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [availableYears, setAvailableYears] = useState([currentYear]); // Initialize with current year
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
  }, [userId, currentYear]);

  // Fetch revenue data by month for selected year
  useEffect(() => {
    const fetchRevenueData = async () => {
      if (!userId || !selectedYear) return;

      try {
        setLoading(true);

        // Fetch sold items with final prices
        const { data, error } = await sb
          .from('items_sold')
          .select('final_price, sold_at, seller_id')
          .eq('seller_id', userId)
          .gte('sold_at', `${selectedYear}-01-01`)
          .lte('sold_at', `${selectedYear}-12-31`);

        if (error) {
          console.error('Error fetching revenue data:', error);
          setDataset([]);
          setLoading(false);
          return;
        }

        const monthlyRevenue = Array.from({ length: 12 }, (_, i) => ({
          month: new Date(2000, i).toLocaleString('default', { month: 'short' }),
          revenue: 0
        }));

        data?.forEach(item => {
          const soldDate = new Date(item.sold_at);
          const month = soldDate.getMonth();
          monthlyRevenue[month].revenue += parseFloat(item.final_price);
        });
        setDataset(monthlyRevenue);
        setLoading(false);
      } catch (error) {
        console.error('Error:', error);
        setLoading(false);
      }
    };

    fetchRevenueData();
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
    <Box>
      {/* Year Selector */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2, justifyContent: 'space-between' }}>
        <Typography variant="h6" component="h3" sx={{ ml: 2, fontWeight: 600, color: 'black' }}>
          Monthly Revenue
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
            {availableYears.map((year) => (
              <MenuItem key={year} value={year}>
                {year}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Bar Chart */}
      <Box sx={{ width: '95%'}}>
        <BarChart
          dataset={dataset}
          yAxis={[{ scaleType: 'band', dataKey: 'month' }]}
          series={[
            {
              dataKey: 'revenue',
              valueFormatter,
              color: '#3b82f6'
            }
          ]}
          layout="horizontal"
          {...chartSetting}
        />
      </Box>
    </Box>
  );
}
