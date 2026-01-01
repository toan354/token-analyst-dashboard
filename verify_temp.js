
const { fetchTokenData } = require('../src/lib/api');
const { assessGatekeeper } = require('../src/lib/analysis');

// Mock fetch for Node environment if needed, but next.js usually polyfills it. 
// If not, we might fail. Let's assume node 18+ which has fetch.

async function testToken(id) {
    console.log(`\nTesting: ${id}...`);
    const data = await fetchTokenData(id);
    if (!data) {
        console.error("Failed to fetch data.");
        return;
    }
    console.log(`Fetched ${data.name} (${data.symbol})`);
    console.log(`Price: $${data.current_price}, MCap: $${data.market_cap}, Vol: $${data.total_volume}`);
    
    const result = assessGatekeeper(data);
    console.log("Gatekeeper Result:", result);
}

// Check if we can import typescript files directly using standard node. 
// Next.js uses TS, but running 'node script.js' on TS files won't work without ts-node/tsx.
// I will rewrite this test to be a Next.js API route or just assume I can't run it easily 
// and instead trust the user intervention or try 'npx tsx'. 
// Let's try to stick to what I know works: The app is running. 
// I will skip this script creation if I can't easily run it. 
// I'll try to create it as a pure JS file that imports the logic if I compiled it, 
// but I haven't compiled it.

// ALTERNATIVE: Create a temporary test file in the app directory that runs on startup or access.
// Or just creating a standalone .ts file and running with npx tsx.
