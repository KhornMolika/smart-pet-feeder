#!/usr/bin/env node

/**
 * ChinChem Smart Pet Feeder - End-to-End Pipeline & MQTT Wire Inspector
 * 
 * Verifies:
 * 1. MQTT Broker TCP & Protocol Connectivity (chinchem.molika.app:1883)
 * 2. Real-time Subscription to all device command topics
 * 3. NextJS / TMA REST API feed command dispatch
 * 4. MQTT message delivery verification across the wire
 * 5. Stop command & Schedule desired configuration synchronization
 */

import mqtt from '../backend/node_modules/mqtt/build/index.js';

const BASE_URL = process.env.API_URL || 'https://chinchem.molika.app';
const MQTT_BROKER = process.env.MQTT_URL || 'mqtt://chinchem.molika.app:1883';
const DEVICE_ID = process.env.DEVICE_ID || 'feeder_esp32_01';
const DURATION_MS = parseInt(process.env.DURATION_MS || '15000', 10);

console.log('\n=================================================================');
console.log(' 🐾 ChinChem Smart Pet Feeder — E2E Pipeline Diagnostic Inspector');
console.log('=================================================================');
console.log(` Target API:        ${BASE_URL}`);
console.log(` MQTT Broker:       ${MQTT_BROKER}`);
console.log(` Target Hardware:   ${DEVICE_ID}`);
console.log(` Test Dispense:     ${DURATION_MS}ms (${Math.round(DURATION_MS / 1000)}s)`);
console.log('=================================================================\n');

let feedCaptured = false;
let stopCaptured = false;
let configCaptured = false;

const client = mqtt.connect(MQTT_BROKER, {
  clientId: `e2e_inspector_${Date.now()}`,
  clean: true,
  connectTimeout: 5000,
});

client.on('error', (err) => {
  console.error('❌ MQTT Client Error:', err.message);
});

client.on('connect', async () => {
  console.log('✅ Connected to Mosquitto MQTT Broker successfully!');

  // Subscribe to all hardware command and telemetry topics
  const topics = [
    `feeders/+/cmd/feed`,
    `feeders/+/cmd/stop`,
    `feeders/+/config/desired`,
    `feeders/+/event/feed`,
    `feeders/+/state`,
  ];

  client.subscribe(topics, { qos: 1 }, (err) => {
    if (err) {
      console.error('❌ Failed to subscribe:', err.message);
      process.exit(1);
    }
    console.log('📡 Subscribed to MQTT topics:\n  ->', topics.join('\n  -> '));
    runTests();
  });
});

client.on('message', (topic, payload) => {
  const text = payload.toString();
  console.log(`\n-------------------------------------------------------------`);
  console.log(`📥 [MQTT WIRE CAPTURE] Topic: ${topic}`);
  try {
    const json = JSON.parse(text);
    console.log(`   Payload:`, JSON.stringify(json, null, 2));
  } catch {
    console.log(`   Payload:`, text);
  }
  console.log(`-------------------------------------------------------------`);

  if (topic.includes('/cmd/feed') && !text.includes('"action":"stop"')) {
    feedCaptured = true;
  }
  if (topic.includes('/cmd/stop') || text.includes('"action":"stop"')) {
    stopCaptured = true;
  }
  if (topic.includes('/config/desired')) {
    configCaptured = true;
  }
});

async function runTests() {
  console.log('\n[Step 1/3] 🍽️ Triggering Manual Feed via Backend API...');
  try {
    const feedRes = await fetch(`${BASE_URL}/api/v1/devices/${DEVICE_ID}/feed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-bff-source': 'NextJS-AppRouter',
      },
      body: JSON.stringify({
        durationMs: DURATION_MS,
        source: 'manual_app',
      }),
    });

    const body = await feedRes.json();
    if (feedRes.ok) {
      console.log('✅ Backend API accepted feed command (HTTP 200 OK):');
      console.log('   Command ID:', body.id);
      console.log('   Duration:  ', body.durationMs, 'ms');
      console.log('   Status:    ', body.status);
      console.log('   Expires At:', body.expiresAt);
    } else {
      console.error('❌ Backend feed dispatch failed (HTTP', feedRes.status, '):', body);
    }
  } catch (err) {
    console.error('❌ Network error calling feed endpoint:', err.message);
  }

  // Wait 3 seconds for MQTT delivery
  await new Promise((r) => setTimeout(r, 3000));

  console.log('\n[Step 2/3] 🛑 Triggering Emergency Stop Feed...');
  try {
    const stopRes = await fetch(`${BASE_URL}/api/v1/devices/${DEVICE_ID}/stop`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-bff-source': 'NextJS-AppRouter',
      },
    });

    const stopBody = await stopRes.json();
    if (stopRes.ok) {
      console.log('✅ Backend accepted stop command (HTTP 200 OK):', stopBody.message);
    } else {
      console.error('❌ Backend stop dispatch failed:', stopBody);
    }
  } catch (err) {
    console.error('❌ Network error calling stop endpoint:', err.message);
  }

  await new Promise((r) => setTimeout(r, 2000));

  console.log('\n[Step 3/3] ⏰ Testing Schedule Synchronization to ESP32...');
  try {
    const schedRes = await fetch(`${BASE_URL}/api/v1/devices/${DEVICE_ID}/schedules`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-bff-source': 'NextJS-AppRouter',
      },
      body: JSON.stringify({
        label: 'Pipeline Test Morning Snack',
        timeLocal: '07:30',
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
        durationMs: DURATION_MS,
        enabled: true,
      }),
    });

    const schedBody = await schedRes.json();
    if (schedRes.ok) {
      console.log('✅ Schedule created and synced to MQTT:');
      console.log('   Schedule ID:', schedBody.id);
      console.log('   Time:       ', schedBody.timeLocal);
      console.log('   Duration:   ', schedBody.durationMs, 'ms');
    } else {
      console.error('❌ Schedule creation failed:', schedBody);
    }
  } catch (err) {
    console.error('❌ Network error calling schedule endpoint:', err.message);
  }

  await new Promise((r) => setTimeout(r, 3000));

  console.log('\n=================================================================');
  console.log(' 📊 E2E Test Results Summary');
  console.log('=================================================================');
  console.log(` 1. Manual Feed MQTT Delivery:    ${feedCaptured ? 'PASSED ✅' : 'FAILED ❌'}`);
  console.log(` 2. Emergency Stop MQTT Delivery:  ${stopCaptured ? 'PASSED ✅' : 'FAILED ❌'}`);
  console.log(` 3. Schedule Sync MQTT Delivery:  ${configCaptured ? 'PASSED ✅' : 'FAILED ❌'}`);
  console.log('=================================================================\n');

  client.end();
  process.exit(feedCaptured ? 0 : 1);
}
