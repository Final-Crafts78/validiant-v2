import { db } from './index';
import { verificationTypes } from './schema';
import { eq, isNull } from 'drizzle-orm';
import * as crypto from 'crypto';

/**
 * Executes a one-time seeding of system default Verification Templates.
 * These act as the predefined starter schemas when setting up a new Client Command Center.
 * By leaving organizationId null or associating them to a system org, they can be duplicated later.
 */

async function seedSystemTemplates() {
  console.log('Seeding System Templates for Client Command Centers...');

  const templates = [
    {
      code: 'ID_VERIFY',
      name: 'Identity Verification Check',
      isActive: true,
      isSystemTemplate: true,
      slaOverrideHours: 24,
      organizationId: null, // Null indicates it's a global template to be cloned
      fieldSchema: [
        {
          fieldKey: 'id_front',
          type: 'photo-request',
          label: 'ID Card (Front)',
          prompt: 'Take a clear, well-lit photo of the front of the government-issued ID card.',
          required: true,
          readRoles: ['manager', 'executive', 'client'],
          writeRoles: ['executive'],
          validationRules: { requireGeoTag: true }
        },
        {
          fieldKey: 'id_back',
          type: 'photo-request',
          label: 'ID Card (Back)',
          prompt: 'Take a clear, well-lit photo of the back of the government-issued ID card.',
          required: true,
          readRoles: ['manager', 'executive', 'client'],
          writeRoles: ['executive'],
          validationRules: { requireGeoTag: true }
        },
        {
          fieldKey: 'id_number',
          type: 'text',
          label: 'ID Number',
          prompt: 'Input the alphanumeric ID string found on the card.',
          required: true,
          readRoles: ['manager', 'executive', 'client'],
          writeRoles: ['executive']
        },
        {
          fieldKey: 'is_match',
          type: 'boolean',
          label: 'Visual Match Verified?',
          prompt: 'Does the subject visually match the ID provided?',
          required: true,
          options: [
            { label: 'Yes', value: true, color: '#10B981' },
            { label: 'No', value: false, color: '#EF4444' }
          ],
          readRoles: ['manager', 'executive', 'client'],
          writeRoles: ['executive']
        },
        {
          fieldKey: 'executive_obs',
          type: 'textarea',
          label: 'Executive Observations',
          prompt: 'Note any anomalies, signs of tampering, or uncooperative behavior.',
          required: false,
          readRoles: ['manager', 'executive'], // Invisible to client
          writeRoles: ['executive']
        }
      ]
    },
    {
      code: 'DELIVERY_CHECK',
      name: 'Secure Delivery Validation',
      isActive: true,
      isSystemTemplate: true,
      slaOverrideHours: 4,
      organizationId: null,
      fieldSchema: [
        {
          fieldKey: 'door_photo',
          type: 'photo-request',
          label: 'Delivery Location Photo',
          prompt: 'Take a wide-angle shot showing the package at the designated location (door/porch).',
          required: true,
          readRoles: ['manager', 'executive', 'client'],
          writeRoles: ['executive'],
          validationRules: { requireGeoTag: true }
        },
        {
          fieldKey: 'recipient_signature',
          type: 'signature',
          label: 'Recipient Signature',
          prompt: 'Have the recipient sign upon handover of the secured asset.',
          required: false,
          readRoles: ['manager', 'executive', 'client'],
          writeRoles: ['executive']
        },
        {
          fieldKey: 'recipient_name',
          type: 'text',
          label: 'Recipient Name',
          required: false,
          readRoles: ['manager', 'executive', 'client'],
          writeRoles: ['executive']
        }
      ]
    }
  ];

  for (const tpl of templates) {
    try {
      // Check if template exists
      const existing = await db
        .select()
        .from(verificationTypes)
        .where(
          eq(verificationTypes.code, tpl.code)
        );
      
      const isGlobalExists = existing.some(e => e.isSystemTemplate === true && e.organizationId === null);
      
      if (!isGlobalExists) {
        // @ts-ignore - organizationId is marked nullable in schema
        await db.insert(verificationTypes).values(tpl);
        console.log(`✅ Seeded template: ${tpl.name}`);
      } else {
        console.log(`ℹ️ System template ${tpl.name} already exists. Skipping.`);
      }
    } catch (e) {
      console.error(`Failed to seed ${tpl.name}:`, e);
    }
  }

  console.log('✅ Command Center templates seeding complete.');
}

// Support running directly or exporting
if (require.main === module) {
  seedSystemTemplates()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seeding failed:', err);
      process.exit(1);
    });
}

export { seedSystemTemplates };
