
import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to create a dummy file of specific size (in MB)
const createDummyFile = (sizeMB) => {
    const sizeBytes = sizeMB * 1024 * 1024;
    const buffer = Buffer.alloc(Math.min(sizeBytes, 10 * 1024 * 1024)); // 10MB chunk to repeat
    return {
        size: sizeBytes,
        readStream: function* () {
            let sent = 0;
            while (sent < sizeBytes) {
                const remaining = sizeBytes - sent;
                const chunk = remaining >= buffer.length ? buffer : buffer.slice(0, remaining);
                sent += chunk.length;
                yield chunk;
            }
        }
    };
};

// Function to perform upload test
const testUpload = (sizeMB, url, fieldName = "file") => {
    return new Promise((resolve, reject) => {
        console.log(`\n[Test] Testing ${sizeMB}MB upload to ${url}...`);

        const dummy = createDummyFile(sizeMB);
        const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';

        const parsedUrl = new URL(url);
        const isHttps = parsedUrl.protocol === 'https:';
        const client = isHttps ? https : http;

        const options = {
            hostname: parsedUrl.hostname,
            port: parsedUrl.port || (isHttps ? 443 : 80),
            path: parsedUrl.pathname,
            method: 'POST',
            headers: {
                'Content-Type': `multipart/form-data; boundary=${boundary}`,
                'Transfer-Encoding': 'chunked' // Use chunked encoding to avoid loading all into RAM
            },
            rejectUnauthorized: false // Ignore self-signed certs for testing
        };

        const req = client.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                const serverHeader = res.headers.server || 'Unknown';
                console.log(`[Result] Status: ${res.statusCode} ${res.statusMessage}`);
                console.log(`[Result] Server Header: ${serverHeader}`);

                // 200/201 = Success
                // 400 = Validation error (Missing fields) -> This means upload SUCCEEDED (it got past Multer/Nginx)
                // 413 = Payload Too Large -> FAILURE
                if (res.statusCode === 200 || res.statusCode === 201 || res.statusCode === 400) {
                    console.log(`✅ Success: request reached application (Status ${res.statusCode})`);
                    resolve(true);
                } else if (res.statusCode === 413) {
                    console.error(`❌ FAILED: 413 Payload Too Large.`);
                    console.error(`   Likely culprit: ${serverHeader}`);
                    if (serverHeader.toLowerCase().includes('nginx')) {
                        console.error(`   -> Check client_max_body_size in Nginx config.`);
                    } else if (serverHeader.toLowerCase().includes('apache')) {
                        console.error(`   -> Check LimitRequestBody in Apache config.`);
                    } else if (serverHeader.toLowerCase().includes('cloudflare')) {
                        console.error(`   -> Cloudflare Free tier limit is 100MB.`);
                    }
                    resolve(false);
                } else {
                    console.warn(`⚠️ Warning: Unexpected status ${res.statusCode}.`);
                    console.warn(`   Response: ${data.substring(0, 200)}...`);
                    resolve(false);
                }
            });
        });

        req.on('error', (e) => {
            console.error(`❌ Request Error: ${e.message}`);
            resolve(false);
        });

        // Write multipart body
        req.write(`--${boundary}\r\n`);
        req.write(`Content-Disposition: form-data; name="${fieldName}"; filename="test-${sizeMB}MB.bin"\r\n`);
        req.write(`Content-Type: application/octet-stream\r\n\r\n`);

        const stream = dummy.readStream();
        const interval = setInterval(() => {
            const { value, done } = stream.next();
            if (done) {
                clearInterval(interval);
                req.write(`\r\n--${boundary}--\r\n`);
                req.end();
            } else {
                req.write(value);
            }
        }, 10); // Small delay to simulate upload
    });
};

const runTests = async () => {
    // Try to auto-detect URL
    // Default to localhost backend port first to rule out backend limit
    // Use /auth/register as it is a public endpoint that accepts file upload (profileImage)
    const backendUrl = 'http://localhost:5000/api/v1/auth/register';

    // Then try the public URL if provided in args
    const publicUrl = process.argv[2] ? `${process.argv[2]}/api/v1/auth/register` : 'https://api.digitalaela.com/api/v1/auth/register';

    console.log("=== Diagnosing Upload Limits ===");

    // Test 1: Direct Backend (10MB - sanity check)
    console.log("--- Phase 1: Direct Backend Check (Port 5000) ---");
    // We expect 400 Bad Request because we aren't sending other required registration fields
    // But if we get 413, that's the limit hit.
    await testUpload(10, backendUrl, "profileImage");
    console.log("-----------------------------------------------");

    // Test 2: Direct Backend (60MB - Cross the 50MB threshold)
    await testUpload(60, backendUrl, "profileImage");
    console.log("-----------------------------------------------");

    if (process.argv[2]) {
        console.log("\n--- Phase 2: Public URL Check (Likely Nginx/Apache) ---");
        // Test 3: Public URL (60MB)
        await testUpload(60, publicUrl, "profileImage");
    } else {
        console.log("\nTo test the public URL (Nginx/Apache), run: node scripts/diagnose-upload-limit.js <YOUR_BASE_URL>");
        console.log("Example: node scripts/diagnose-upload-limit.js https://api.digitalaela.com");
    }
};

runTests();
