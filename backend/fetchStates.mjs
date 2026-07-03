import fs from 'fs';

async function fetchLocations() {
  try {
    const res = await fetch('https://raw.githubusercontent.com/sab99r/Indian-States-And-Districts/master/states.json');
    const data = await res.json();
    
    // The data is usually an object with states as keys and array of districts as values
    // Wait, the sab99r repo structure might be { states: [ { state: "...", districts: [...] } ] }
    let tsCode = `export const INDIAN_LOCATIONS: Record<string, string[]> = {\n`;
    
    if (data.states) {
      data.states.forEach(stateObj => {
        tsCode += `  "${stateObj.state}": ${JSON.stringify(stateObj.districts)},\n`;
      });
    } else {
      for (const state in data) {
        tsCode += `  "${state}": ${JSON.stringify(data[state])},\n`;
      }
    }
    
    tsCode += `};\n`;
    
    fs.writeFileSync('../frontend/src/utils/locations.ts', tsCode, 'utf8');
    console.log('Successfully generated locations.ts with states and districts.');
  } catch (error) {
    console.error('Failed to fetch and process data:', error);
  }
}

fetchLocations();
