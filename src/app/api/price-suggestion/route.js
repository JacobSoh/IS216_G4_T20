import { NextResponse } from 'next/server';
import { getJson } from 'serpapi';

// Condition multipliers - adjust price based on item condition
const CONDITION_MULTIPLIERS = {
  'mint': 1.0,       // 100% - Brand new condition
  'excellent': 0.85, // 85% - Like new
  'good': 0.70,      // 70% - Slightly used
  'fair': 0.50,      // 50% - Noticeable wear
  'poor': 0.30       // 30% - Significant damage
};

// Function to remove outliers using IQR method
function removeOutliers(prices) {
  if (prices.length < 4) return prices;
  
  const sorted = [...prices].sort((a, b) => a - b);
  const q1 = sorted[Math.floor(sorted.length * 0.25)];
  const q3 = sorted[Math.floor(sorted.length * 0.75)];
  const iqr = q3 - q1;
  
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;
  
  const filtered = sorted.filter(price => price >= lowerBound && price <= upperBound);
  return filtered.length > 0 ? filtered : sorted;
}

export async function POST(request) {
  try {
    const { itemName, itemCondition = 'good' } = await request.json();

    // Basic length check
    if (!itemName || itemName.length < 3) {
      return NextResponse.json({
        success: false,
        error: 'Item name must be at least 3 characters'
      });
    }

    console.log('🔍 Searching Google Shopping for:', itemName);
    console.log('📦 Item Condition:', itemCondition);

    // Search Google Shopping using SerpAPI
    const results = await getJson({
      engine: "google_shopping",
      q: itemName,
      api_key: process.env.NEXT_PUBLIC_SERPAPI_KEY,
      num: 100
    });

    console.log('📦 API Response received');
    const resultsCount = results.shopping_results?.length || 0;
    console.log('🔢 Results returned by SerpAPI:', resultsCount);

    // VALIDATION: Real products return 35+ results from SerpAPI
    if (resultsCount < 35) {
      console.log('❌ Not enough results found:', resultsCount);
      return NextResponse.json({
        success: false,
        error: `Only found ${resultsCount} products for "${itemName}". This doesn't appear to be a real product. Try a more popular item.`
      });
    }

    console.log(`✅ Found ${resultsCount} products - legitimate product detected`);

    // Extract prices
    const prices = [];
    results.shopping_results.forEach(item => {
      let price = null;
      
      if (item.extracted_price) {
        price = item.extracted_price;
      } else if (item.price) {
        const priceMatch = item.price.toString().match(/[\d,]+\.?\d*/);
        if (priceMatch) {
          price = parseFloat(priceMatch[0].replace(/,/g, ''));
        }
      }

      if (price && price > 0 && price < 500000) {
        prices.push(price);
      }
    });

    console.log(`💰 Extracted ${prices.length} valid prices from ${resultsCount} products`);

    // Require at least 5 valid prices
    if (prices.length < 5) {
      return NextResponse.json({
        success: false,
        error: `Only found ${prices.length} reliable price${prices.length !== 1 ? 's' : ''} for "${itemName}". Please try a more common product.`
      });
    }

    // Remove outliers
    const filteredPrices = removeOutliers(prices);
    const outliersRemoved = prices.length - filteredPrices.length;

    console.log(`🧹 Removed ${outliersRemoved} outliers, keeping ${filteredPrices.length} prices`);

    if (filteredPrices.length < 3) {
      return NextResponse.json({
        success: false,
        error: 'Price data is too inconsistent. Please enter the price manually.'
      });
    }

    // Calculate statistics
    filteredPrices.sort((a, b) => a - b);
    const avgPrice = filteredPrices.reduce((a, b) => a + b, 0) / filteredPrices.length;
    const medianPrice = filteredPrices[Math.floor(filteredPrices.length / 2)];
    const minPrice = filteredPrices[0];
    const maxPrice = filteredPrices[filteredPrices.length - 1];

    // Calculate price variance to determine confidence
    const variance = filteredPrices.reduce((sum, price) => sum + Math.pow(price - avgPrice, 2), 0) / filteredPrices.length;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = (stdDev / avgPrice) * 100;

    console.log(`📊 Price Statistics:`);
    console.log(`   - Samples: ${filteredPrices.length}`);
    console.log(`   - Std Dev: $${stdDev.toFixed(2)}`);
    console.log(`   - Coefficient of Variation: ${coefficientOfVariation.toFixed(1)}%`);

    // Determine confidence
    let confidence = 'low';
    
    if (filteredPrices.length >= 15 && coefficientOfVariation < 15) {
      confidence = 'high';
    } else if (filteredPrices.length >= 8 && coefficientOfVariation < 25) {
      confidence = 'medium';
    } else if (filteredPrices.length >= 5 && coefficientOfVariation < 35) {
      confidence = 'medium';
    } else {
      confidence = 'low';
    }

    console.log(`🎯 Confidence: ${confidence.toUpperCase()}`);

    // Get condition multiplier
    const conditionMultiplier = CONDITION_MULTIPLIERS[itemCondition] || CONDITION_MULTIPLIERS['good'];
    const conditionPercentage = Math.round(conditionMultiplier * 100);

    // Apply condition multiplier to suggested bid
    const suggestedMinBid = Math.round(medianPrice * 0.75 * conditionMultiplier);
    const suggestedBidIncrement = Math.max(1, Math.round(suggestedMinBid * 0.05));

    console.log(`✨ Suggested price: $${suggestedMinBid} (${conditionPercentage}% of median)`);

    return NextResponse.json({
      success: true,
      data: {
        marketValue: Math.round(avgPrice * conditionMultiplier),
        suggestedMinBid,
        suggestedBidIncrement,
        priceRange: {
          min: Math.round(minPrice * conditionMultiplier),
          max: Math.round(maxPrice * conditionMultiplier),
          median: Math.round(medianPrice * conditionMultiplier)
        },
        samplesFound: filteredPrices.length,
        outliersRemoved,
        explanation: `Analyzed ${prices.length} listings from Google Shopping${outliersRemoved > 0 ? `, removed ${outliersRemoved} outlier${outliersRemoved !== 1 ? 's' : ''}` : ''}. Adjusted for ${itemCondition} condition. Starting at 75% attracts bidders.`,
        confidence: confidence,
        source: 'Google Shopping',
        conditionAdjustment: conditionPercentage
      }
    });

  } catch (error) {
    console.error('❌ SerpAPI Error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Unable to fetch price data. Please try again or enter price manually.',
      details: error.message
    }, { status: 500 });
  }
}
