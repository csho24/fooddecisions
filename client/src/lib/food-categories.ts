/**
 * Categorizes food items into predefined categories based on their names
 */
export type FoodCategory = 'Noodles' | 'Rice' | 'Ethnic' | 'Light' | 'Western';

export function categorizeFood(name: string): FoodCategory {
  const lowerName = name.toLowerCase();
  
  // Noodles
  if (
    lowerName.includes('noodle') ||
    lowerName.includes('mee') ||
    lowerName.includes('pasta') ||
    lowerName.includes('ramen') ||
    lowerName.includes('laksa') ||
    lowerName.includes('mee goreng') ||
    lowerName.includes('mee rebus') ||
    lowerName.includes('wonton') ||
    lowerName.includes('wantan')
  ) {
    return 'Noodles';
  }
  
  // Rice
  if (
    lowerName.includes('rice') ||
    lowerName.includes('nasi') ||
    lowerName.includes('fried rice') ||
    lowerName.includes('chicken rice') ||
    lowerName.includes('claypot') ||
    lowerName.includes('clay pot') ||
    lowerName.includes('biryani') ||
    lowerName.includes('risotto')
  ) {
    return 'Rice';
  }
  
  // Western
  if (
    lowerName.includes('burger') ||
    lowerName.includes('chicken chop') ||
    lowerName.includes('fish and chips') ||
    lowerName.includes('fish & chips') ||
    lowerName.includes('pizza') ||
    lowerName.includes('steak') ||
    lowerName.includes('pasta') ||
    lowerName.includes('spaghetti') ||
    lowerName.includes('sandwich') ||
    lowerName.includes('wrap')
  ) {
    return 'Western';
  }
  
  // Light
  if (
    lowerName.includes('hum chim peng') ||
    lowerName.includes('chee cheong fan') ||
    lowerName.includes('popiah') ||
    lowerName.includes('dim sum') ||
    lowerName.includes('dumpling') ||
    lowerName.includes('bao') ||
    lowerName.includes('steamed') ||
    lowerName.includes('soup') ||
    lowerName.includes('salad')
  ) {
    return 'Light';
  }
  
  // Default to Ethnic for everything else (Asian dishes that don't fit above)
  return 'Ethnic';
}
