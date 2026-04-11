// Top 60 Indian cities for autocomplete
export const INDIAN_CITIES = [
  "Agra", "Ahmedabad", "Amritsar", "Aurangabad", "Bangalore",
  "Bhopal", "Bhubaneswar", "Chandigarh", "Chennai", "Coimbatore",
  "Dehradun", "Delhi", "Faridabad", "Ghaziabad", "Goa (Panaji)",
  "Gurgaon", "Guwahati", "Hyderabad", "Indore", "Jaipur",
  "Jalandhar", "Jammu", "Jodhpur", "Kanpur", "Kochi",
  "Kolkata", "Kozhikode", "Lucknow", "Ludhiana", "Madurai",
  "Mangalore", "Meerut", "Mumbai", "Mysore", "Nagpur",
  "Nashik", "Noida", "Patna", "Prayagraj", "Pune",
  "Raipur", "Rajkot", "Ranchi", "Srinagar", "Surat",
  "Thane", "Thiruvananthapuram", "Tiruchirappalli", "Udaipur", "Vadodara",
  "Varanasi", "Vijayawada", "Visakhapatnam",
];

export function filterCities(query) {
  if (!query || query.length < 1) return [];
  const q = query.toLowerCase();
  return INDIAN_CITIES.filter(c => c.toLowerCase().startsWith(q)).slice(0, 6);
}
