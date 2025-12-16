
import jwt from 'jsonwebtoken';

const TOKEN = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyZXF1ZXN0SWQiOiIzNTZjNzA2ODQ5NzIzNzM2MzUzMjMzMzgiLCJjb21wYW55SWQiOjQ4Mjk0MH0.J630AI_pt3s_BlKQEenXQRlZqVB1hifAwb27xXcGqOM";
const AUTH_KEY = "482940Tknm3Vdw694116c5P1";

// Try verifying with the Auth Key
try {
    const decoded = jwt.verify(TOKEN, AUTH_KEY);
    console.log("SUCCESS! Token verified locally.");
    console.log("Decoded:", decoded);
} catch (error: any) {
    console.log("Verification Failed:", error.message);
}

// Also try decoding without verification to see contents
const decodedUnsafe = jwt.decode(TOKEN);
console.log("Unsafe Decode:", decodedUnsafe);
