import { db } from './index';
import { typeTemplates } from './schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

/**
 * Phase 6.C: Project Archetype Marketplace Seeding
 * Populates the system with high-fidelity industry templates.
 */

async function seedArchetypes() {
  console.log('Seeding Validiant Project Archetypes...');

  const archetypes = [
    {
      id: uuidv4(),
      name: 'Identity Verification (BGV)',
      description: 'Standard background check for candidates, including ID, education, and criminal history verification.',
      industry: 'Human Resources',
      isPublic: true,
      typeDefinition: {
        typeName: 'Candidate Check',
        typeIcon: 'UserCheck',
        typeColor: '#4F46E5',
        columns: [
          { name: 'Candidate Name', key: 'candidate_name', columnType: 'text', isRequired: true },
          { name: 'Government ID', key: 'gov_id', columnType: 'text', isRequired: true },
          { name: 'ID Photo', key: 'id_photo', columnType: 'photo-request', isRequired: true },
          { name: 'Address Proof', key: 'address_proof', columnType: 'photo-request', isRequired: false },
          { name: 'Education Level', key: 'education', columnType: 'select', options: ['High School', 'Bachelors', 'Masters', 'PhD'], isRequired: true },
          { name: 'Criminal Record Match', key: 'criminal_match', columnType: 'boolean', isRequired: true },
          { name: 'Final Recommendation', key: 'recommendation', columnType: 'select', options: ['Pass', 'Fail', 'Discrepancy'], isRequired: true }
        ]
      }
    },
    {
      id: uuidv4(),
      name: 'ISO 27001 Audit',
      description: 'Comprehensive information security management system audit template with evidence tracking.',
      industry: 'Compliance',
      isPublic: true,
      typeDefinition: {
        typeName: 'Compliance Control',
        typeIcon: 'ShieldCheck',
        typeColor: '#10B981',
        columns: [
          { name: 'Control ID', key: 'control_id', columnType: 'text', isRequired: true },
          { name: 'Control Owner', key: 'owner', columnType: 'text', isRequired: true },
          { name: 'Status', key: 'status', columnType: 'select', options: ['Compliant', 'Non-Compliant', 'Partial', 'N/A'], isRequired: true },
          { name: 'Evidence Description', key: 'evidence_desc', columnType: 'textarea', isRequired: true },
          { name: 'Evidence Link', key: 'evidence_url', columnType: 'text', isRequired: false },
          { name: 'Risk Level', key: 'risk', columnType: 'select', options: ['Low', 'Medium', 'High', 'Critical'], isRequired: true },
          { name: 'Auditor Observation', key: 'observation', columnType: 'textarea', isRequired: false }
        ]
      }
    },
    {
      id: uuidv4(),
      name: 'Site Safety Inspection',
      description: 'Mobile-optimized industrial safety inspection for field agents tracking hazards and GPS location.',
      industry: 'Construction',
      isPublic: true,
      typeDefinition: {
        typeName: 'Safety Hazard',
        typeIcon: 'HardHat',
        typeColor: '#F59E0B',
        columns: [
          { name: 'Inspection Site', key: 'site_id', columnType: 'text', isRequired: true },
          { name: 'Hazard Type', key: 'hazard_type', columnType: 'select', options: ['Electrical', 'Fall Risk', 'PPE Lack', 'Chemical', 'Other'], isRequired: true },
          { name: 'Severity Level', key: 'severity', columnType: 'rating', isRequired: true },
          { name: 'Hazard Photo', key: 'hazard_photo', columnType: 'photo-request', isRequired: true },
          { name: 'GPS Verification', key: 'gps_loc', columnType: 'text', isRequired: true }, // Placeholder, GPS is actually built-in
          { name: 'Correction Needed', key: 'action_required', columnType: 'textarea', isRequired: true },
          { name: 'Sign-off', key: 'signature', columnType: 'signature', isRequired: true }
        ]
      }
    }
  ];

  for (const arche of archetypes) {
    try {
      const existing = await db
        .select()
        .from(typeTemplates)
        .where(eq(typeTemplates.name, arche.name));

      if (existing.length === 0) {
        await db.insert(typeTemplates).values(arche);
        console.log(`✅ Seeded archetype: ${arche.name}`);
      } else {
        console.log(`ℹ️ Archetype ${arche.name} already exists. Skipping.`);
      }
    } catch (e: any) {
      console.error(`Failed to seed archetype ${arche.name}:`, e.message);
    }
  }

  console.log('✅ Validiant Archetypes seeding complete.');
}

// Export for execution
export { seedArchetypes };

// Run if called directly
if (require.main === module) {
  seedArchetypes().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
  });
}
