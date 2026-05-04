// Coordinates for major Indian cities — used for radius-based "Near Me" filtering.
// Add more cities here as needed.
export const CITY_COORDS = {
  // ── Bihar ─────────────────────────────────────
  'Patna':       { lat: 25.5941, lng: 85.1376 },
  'Darbhanga':   { lat: 26.1542, lng: 85.8918 },
  'Muzaffarpur': { lat: 26.1209, lng: 85.3647 },
  'Gaya':        { lat: 24.7914, lng: 85.0002 },
  'Bhagalpur':   { lat: 25.2425, lng: 86.9842 },
  'Hajipur':     { lat: 25.6880, lng: 85.2092 },
  'Begusarai':   { lat: 25.4185, lng: 86.1272 },
  'Samastipur':  { lat: 25.8630, lng: 85.7810 },
  'Sitamarhi':   { lat: 26.5972, lng: 85.4872 },
  'Madhubani':   { lat: 26.3563, lng: 86.0721 },
  'Motihari':    { lat: 26.6506, lng: 84.9173 },
  'Purnia':      { lat: 25.7771, lng: 87.4753 },
  'Siwan':       { lat: 26.2193, lng: 84.3574 },
  'Chapra':      { lat: 25.7856, lng: 84.7484 },
  'Munger':      { lat: 25.3734, lng: 86.4733 },
  'Nalanda':     { lat: 25.1376, lng: 85.4449 },
  'Nawada':      { lat: 24.8862, lng: 85.5380 },
  'Buxar':       { lat: 25.5648, lng: 83.9710 },
  'Arrah':       { lat: 25.5561, lng: 84.6634 },
  'Supaul':      { lat: 26.1236, lng: 86.6032 },
  'Kishanganj':  { lat: 26.0954, lng: 87.9406 },
  'Katihar':     { lat: 25.5389, lng: 87.5722 },
  'Araria':      { lat: 26.1479, lng: 87.4315 },
  'Jehanabad':   { lat: 25.2133, lng: 84.9929 },
  'Aurangabad':  { lat: 24.7517, lng: 84.3741 },
  'Vaishali':    { lat: 25.7039, lng: 85.1754 },
  'Forbesganj':  { lat: 26.3000, lng: 87.2500 },
  // ── Jharkhand ─────────────────────────────────
  'Ranchi':      { lat: 23.3441, lng: 85.3096 },
  'Jamshedpur':  { lat: 22.8046, lng: 86.2029 },
  'Dhanbad':     { lat: 23.7957, lng: 86.4304 },
  'Bokaro':      { lat: 23.6693, lng: 86.1511 },
  // ── Uttar Pradesh ─────────────────────────────
  'Lucknow':     { lat: 26.8467, lng: 80.9462 },
  'Varanasi':    { lat: 25.3176, lng: 82.9739 },
  'Prayagraj':   { lat: 25.4358, lng: 81.8463 },
  'Kanpur':      { lat: 26.4499, lng: 80.3319 },
  'Agra':        { lat: 27.1767, lng: 78.0081 },
  'Meerut':      { lat: 28.9845, lng: 77.7064 },
  'Gorakhpur':   { lat: 26.7606, lng: 83.3732 },
  'Ghaziabad':   { lat: 28.6692, lng: 77.4538 },
  'Noida':       { lat: 28.5355, lng: 77.3910 },
  'Bareilly':    { lat: 28.3670, lng: 79.4304 },
  'Aligarh':     { lat: 27.8974, lng: 78.0880 },
  'Mathura':     { lat: 27.4924, lng: 77.6737 },
  // ── Delhi / NCR ───────────────────────────────
  'Delhi':       { lat: 28.6139, lng: 77.2090 },
  'Gurgaon':     { lat: 28.4595, lng: 77.0266 },
  'Faridabad':   { lat: 28.4089, lng: 77.3178 },
  // ── West Bengal ───────────────────────────────
  'Kolkata':     { lat: 22.5726, lng: 88.3639 },
  'Siliguri':    { lat: 26.7271, lng: 88.3953 },
  'Asansol':     { lat: 23.6888, lng: 86.9661 },
  // ── Maharashtra ───────────────────────────────
  'Mumbai':      { lat: 19.0760, lng: 72.8777 },
  'Pune':        { lat: 18.5204, lng: 73.8567 },
  'Nagpur':      { lat: 21.1458, lng: 79.0882 },
  'Nashik':      { lat: 19.9975, lng: 73.7898 },
  'Aurangabad (MH)': { lat: 19.8762, lng: 75.3433 },
  // ── Gujarat ───────────────────────────────────
  'Ahmedabad':   { lat: 23.0225, lng: 72.5714 },
  'Surat':       { lat: 21.1702, lng: 72.8311 },
  'Vadodara':    { lat: 22.3072, lng: 73.1812 },
  'Rajkot':      { lat: 22.3039, lng: 70.8022 },
  // ── Rajasthan ─────────────────────────────────
  'Jaipur':      { lat: 26.9124, lng: 75.7873 },
  'Jodhpur':     { lat: 26.2389, lng: 73.0243 },
  'Udaipur':     { lat: 24.5854, lng: 73.7125 },
  'Ajmer':       { lat: 26.4499, lng: 74.6399 },
  // ── Madhya Pradesh ────────────────────────────
  'Bhopal':      { lat: 23.2599, lng: 77.4126 },
  'Indore':      { lat: 22.7196, lng: 75.8577 },
  'Jabalpur':    { lat: 23.1815, lng: 79.9864 },
  'Gwalior':     { lat: 26.2183, lng: 78.1828 },
  // ── Karnataka ─────────────────────────────────
  'Bangalore':   { lat: 12.9716, lng: 77.5946 },
  'Mysore':      { lat: 12.2958, lng: 76.6394 },
  'Hubli':       { lat: 15.3647, lng: 75.1240 },
  // ── Tamil Nadu ────────────────────────────────
  'Chennai':     { lat: 13.0827, lng: 80.2707 },
  'Coimbatore':  { lat: 11.0168, lng: 76.9558 },
  'Madurai':     { lat:  9.9252, lng: 78.1198 },
  // ── Telangana / AP ────────────────────────────
  'Hyderabad':   { lat: 17.3850, lng: 78.4867 },
  'Visakhapatnam':{ lat: 17.6868, lng: 83.2185 },
  // ── Kerala ────────────────────────────────────
  'Kochi':       { lat:  9.9312, lng: 76.2673 },
  'Thiruvananthapuram': { lat: 8.5241, lng: 76.9366 },
  'Kozhikode':   { lat: 11.2588, lng: 75.7804 },
  // ── Punjab / Haryana ──────────────────────────
  'Chandigarh':  { lat: 30.7333, lng: 76.7794 },
  'Ludhiana':    { lat: 30.9010, lng: 75.8573 },
  'Amritsar':    { lat: 31.6340, lng: 74.8723 },
  'Jalandhar':   { lat: 31.3260, lng: 75.5762 },
  // ── Uttarakhand / HP ──────────────────────────
  'Dehradun':    { lat: 30.3165, lng: 78.0322 },
  'Haridwar':    { lat: 29.9457, lng: 78.1642 },
  'Shimla':      { lat: 31.1048, lng: 77.1734 },
  // ── Odisha ────────────────────────────────────
  'Bhubaneswar': { lat: 20.2961, lng: 85.8245 },
  'Cuttack':     { lat: 20.4625, lng: 85.8828 },
  // ── Assam ─────────────────────────────────────
  'Guwahati':    { lat: 26.1445, lng: 91.7362 },
};

// Haversine distance in km between two lat/lng points
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Returns cities within radiusKm of the given coordinates, sorted by distance
export function getNearbyCities(lat, lng, radiusKm = 100) {
  const results = [];
  for (const [city, coords] of Object.entries(CITY_COORDS)) {
    const dist = haversineKm(lat, lng, coords.lat, coords.lng);
    if (dist <= radiusKm) {
      results.push({ city, dist: Math.round(dist) });
    }
  }
  return results.sort((a, b) => a.dist - b.dist);
}

// Quick-select popular cities shown in search bars (ordered by general popularity)
export const POPULAR_CITIES = [
  'Patna', 'Darbhanga', 'Muzaffarpur', 'Delhi', 'Kolkata',
  'Lucknow', 'Varanasi', 'Mumbai', 'Bangalore', 'Hyderabad',
  'Gorakhpur', 'Ranchi', 'Prayagraj', 'Siliguri', 'Guwahati',
  'Kanpur', 'Agra', 'Bhopal', 'Pune', 'Chennai',
];
