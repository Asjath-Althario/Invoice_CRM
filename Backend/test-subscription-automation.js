#!/usr/bin/env node

/**
 * Test Script for Subscription Automation
 * Run this to verify the system is working correctly
 */

const axios = require('axios');

const API_BASE = 'http://localhost:5001/api';

// You'll need to update this with your actual JWT token
// Get it by logging in through the app
const AUTH_TOKEN = 'YOUR_JWT_TOKEN_HERE';

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${AUTH_TOKEN}`
};

async function testHealthCheck() {
  console.log('\n🔍 Testing Health Check...');
  try {
    const response = await axios.get(`${API_BASE}/health`);
    console.log('✅ Server is running:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    return false;
  }
}

async function testCronStatus() {
  console.log('\n🔍 Testing Cron Job Status...');
  try {
    const response = await axios.get(`${API_BASE}/subscription-automation/cron-status`, { headers });
    console.log('✅ Cron Jobs Status:', JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Cron status check failed:', error.response?.data || error.message);
    console.log('💡 Make sure you have a valid AUTH_TOKEN in this script');
    return false;
  }
}

async function testProcessSubscriptions() {
  console.log('\n🔍 Testing Manual Subscription Processing...');
  try {
    const response = await axios.post(
      `${API_BASE}/subscription-automation/process-subscriptions`,
      { daysBeforeDue: 3 },
      { headers }
    );
    console.log('✅ Subscription Processing Result:', JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Subscription processing failed:', error.response?.data || error.message);
    return false;
  }
}

async function testGetSubscriptions() {
  console.log('\n🔍 Testing Get Subscriptions...');
  try {
    const response = await axios.get(`${API_BASE}/recurring-invoices`, { headers });
    const subscriptions = response.data;
    console.log(`✅ Found ${subscriptions.length} subscription(s)`);
    
    if (subscriptions.length > 0) {
      console.log('\n📋 Subscriptions:');
      subscriptions.forEach((sub, index) => {
        console.log(`\n${index + 1}. ${sub.contact?.name || 'Unknown'}`);
        console.log(`   - Frequency: ${sub.frequency}`);
        console.log(`   - Status: ${sub.status}`);
        console.log(`   - Amount: $${sub.total_amount}`);
        console.log(`   - Start: ${sub.startDate || sub.start_date}`);
      });
    } else {
      console.log('💡 No subscriptions found. Create one in the UI to test!');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Failed to get subscriptions:', error.response?.data || error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting Subscription Automation Tests...\n');
  console.log('=' .repeat(60));
  
  if (AUTH_TOKEN === 'YOUR_JWT_TOKEN_HERE') {
    console.log('\n⚠️  WARNING: You need to update AUTH_TOKEN in this script!');
    console.log('💡 Get your token by:');
    console.log('   1. Login to the app');
    console.log('   2. Open browser DevTools → Application → Local Storage');
    console.log('   3. Copy the token value');
    console.log('   4. Paste it in this script\n');
  }
  
  const results = {
    healthCheck: await testHealthCheck(),
    cronStatus: await testCronStatus(),
    subscriptions: await testGetSubscriptions(),
    processing: false
  };
  
  // Only test processing if we have valid auth
  if (results.cronStatus) {
    results.processing = await testProcessSubscriptions();
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Test Results:');
  console.log('─'.repeat(60));
  console.log(`Health Check:        ${results.healthCheck ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Cron Status:         ${results.cronStatus ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Get Subscriptions:   ${results.subscriptions ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Process Subs:        ${results.processing ? '✅ PASS' : '⏭️  SKIP'}`);
  console.log('─'.repeat(60));
  
  const passedTests = Object.values(results).filter(r => r === true).length;
  const totalTests = Object.keys(results).length;
  
  console.log(`\n📈 Overall: ${passedTests}/${totalTests} tests passed\n`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Subscription automation is working perfectly!\n');
  } else if (results.healthCheck && !results.cronStatus) {
    console.log('💡 Tip: Update AUTH_TOKEN in this script to run authenticated tests\n');
  } else {
    console.log('⚠️  Some tests failed. Check the error messages above.\n');
  }
}

// Run the tests
runTests().catch(error => {
  console.error('❌ Test script error:', error);
  process.exit(1);
});
