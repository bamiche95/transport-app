const axios = require('axios');

// 1. Double check this matches EXACTLY what is in your .env.local
const SECRET = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoicGV0ZXIuaXRla2FAZ21haWwuY29tIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzM4MzQ0MzY2LCJleHAiOjE3Mzg0MzAzNjZ9.df-AtKCS4Hbm8Nh3d0AVNLGQWTcALo65R-CeE'; 
const URL = 'http://localhost:3000/api/cron/send-reports';

async function runTest() {
    console.log("Checking if report is due...");
    try {
        const response = await axios.get(URL, {
            params: { token: SECRET }
        });
        console.log("Server Response:", response.data);
    } catch (error) {
        if (error.response) {
            console.error(`Error ${error.response.status}: ${JSON.stringify(error.response.data)}`);
        } else {
            console.error("Error:", error.message);
        }
    }
}

runTest();