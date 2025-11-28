// Simple API test script
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api/v1';

async function testAPI() {
  try {
    console.log('Testing API v1...');
    
    // Test API root endpoint
    const response = await axios.get(`${BASE_URL}/`);
    console.log('API Root Response:', response.data);
    
    console.log('API v1 is working!');
  } catch (error) {
    console.error('API Test Error:', error.response?.status, error.response?.data || error.message);
  }
}

testAPI();