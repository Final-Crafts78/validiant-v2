import axios from 'axios';
import { logger } from '../utils/logger';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../../.env') });

/**
 * Verification Script: Test Public Inbound API
 * This script simulates an external system POSTing data to the project universe.
 */
async function testIngest() {
  const API_URL = process.env.API_URL || 'http://localhost:3001/api/v1';
  
  // Replace these with actual values from your local DB for testing
  // OR create a temporary test project/key if needed.
  const PROJECT_KEY = 'PJ-M001'; // Example project key
  const API_KEY = 'validiant_sk_test_12345'; // Example API key
  const TYPE_NAME = 'Identity Verification';

  logger.info(`Testing Public Inbound API at: ${API_URL}/ingest/${PROJECT_KEY}`);

  try {
    // 1. First Ingestion (Should succeed)
    const externalId = `test-case-${Date.now()}`;
    logger.info(`Attempting first ingestion for External ID: ${externalId}`);
    
    const res1 = await axios.post(`${API_URL}/ingest/${PROJECT_KEY}`, {
      type: TYPE_NAME,
      externalId,
      data: {
        applicant_name: "John Doe",
        verification_status: "pending"
      }
    }, {
      headers: { 'x-api-key': API_KEY }
    });

    logger.info('First ingestion SUCCESS:', res1.data);

    // 2. Duplicate Ingestion (Should fail with 409)
    logger.info(`Attempting duplicate ingestion for External ID: ${externalId}`);
    try {
      await axios.post(`${API_URL}/ingest/${PROJECT_KEY}`, {
        type: TYPE_NAME,
        externalId,
        data: {
          applicant_name: "John Doe Redundant",
        }
      }, {
        headers: { 'x-api-key': API_KEY }
      });
      logger.error('Duplicate ingestion SHOULD HAVE FAILED but did not.');
    } catch (err: any) {
      if (err.response?.status === 409) {
        logger.info('Duplicate ingestion REJECTED as expected (409 Conflict):', err.response.data);
      } else {
        logger.error('Duplicate ingestion failed with unexpected error:', err.message);
      }
    }

  } catch (error: any) {
    logger.error('Ingest Test FAILED:', error.response?.data || error.message);
  }
}

testIngest();
