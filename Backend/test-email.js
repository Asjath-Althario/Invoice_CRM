require('dotenv').config();
const nodemailer = require('nodemailer');

console.log('Testing email configuration...');
console.log('Host:', process.env.EMAIL_HOST);
console.log('Port:', process.env.EMAIL_PORT);
console.log('User:', process.env.EMAIL_USER);
console.log('Password:', process.env.EMAIL_PASSWORD ? '***' + process.env.EMAIL_PASSWORD.slice(-4) : 'NOT SET');

async function testEmail() {
    console.log('\n=== Testing Configuration 1: Full email as username ===');
    const transporter1 = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT),
        secure: true,
        auth: {
            user: process.env.EMAIL_USER, // Full email
            pass: process.env.EMAIL_PASSWORD,
        },
        tls: {
            rejectUnauthorized: false
        }
    });

    try {
        await transporter1.verify();
        console.log('✅ Configuration 1 WORKS: Using full email as username');
        return;
    } catch (error) {
        console.log('❌ Configuration 1 FAILED:', error.message);
    }

    console.log('\n=== Testing Configuration 2: Username without domain ===');
    const usernameOnly = process.env.EMAIL_USER.split('@')[0];
    const transporter2 = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT),
        secure: true,
        auth: {
            user: usernameOnly, // Just username
            pass: process.env.EMAIL_PASSWORD,
        },
        tls: {
            rejectUnauthorized: false
        }
    });

    try {
        await transporter2.verify();
        console.log('✅ Configuration 2 WORKS: Using username without domain');
        console.log('Update your .env file to use:', usernameOnly);
        return;
    } catch (error) {
        console.log('❌ Configuration 2 FAILED:', error.message);
    }

    console.log('\n=== Testing Configuration 3: Port 587 with TLS (full email) ===');
    const transporter3 = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: 587,
        secure: false, // Use TLS
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
        },
        tls: {
            rejectUnauthorized: false
        }
    });

    try {
        await transporter3.verify();
        console.log('✅ Configuration 3 WORKS: Port 587 with TLS and full email');
        console.log('Update your .env file: EMAIL_PORT=587 and EMAIL_SECURE=false');
        return;
    } catch (error) {
        console.log('❌ Configuration 3 FAILED:', error.message);
    }

    console.log('\n=== Testing Configuration 4: Port 587 with TLS (username only) ===');
    const transporter4 = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: 587,
        secure: false,
        auth: {
            user: usernameOnly,
            pass: process.env.EMAIL_PASSWORD,
        },
        tls: {
            rejectUnauthorized: false
        }
    });

    try {
        await transporter4.verify();
        console.log('✅ Configuration 4 WORKS: Port 587 with TLS and username only');
        console.log('Update your .env file:');
        console.log('  EMAIL_PORT=587');
        console.log('  EMAIL_SECURE=false');
        console.log('  EMAIL_USER=' + usernameOnly);
        return;
    } catch (error) {
        console.log('❌ Configuration 4 FAILED:', error.message);
    }

    console.log('\n=== Possible Issues ===');
    console.log('1. Password might be incorrect');
    console.log('2. Account might not exist or be disabled');
    console.log('3. Email authentication might require different settings');
    console.log('4. Special characters in password might need URL encoding');
    console.log('\n=== Next Steps ===');
    console.log('Please verify in cPanel:');
    console.log('- The email account exists');
    console.log('- The password is correct');
    console.log('- Check Email Accounts > Configure Client');
    console.log('- Look for the exact username format required');
    console.log('- Try generating a new simpler password without special characters');
}

testEmail().catch(console.error);
