"use client";

// Drug interaction database - common interactions
export interface DrugInteraction {
  drug1: string;
  drug2: string;
  severity: 'mild' | 'moderate' | 'severe';
  effect: string;
  recommendation: string;
}

export const knownInteractions: DrugInteraction[] = [
  { drug1: 'Aspirin', drug2: 'Warfarin', severity: 'severe', effect: 'Increased bleeding risk', recommendation: 'Avoid combination or monitor closely' },
  { drug1: 'Methotrexate', drug2: 'Ibuprofen', severity: 'severe', effect: 'Increased toxicity', recommendation: 'Avoid NSAIDs with methotrexate' },
  { drug1: 'Digoxin', drug2: 'Amiodarone', severity: 'severe', effect: 'Increased digoxin levels', recommendation: 'Reduce digoxin dose by 50%' },
  { drug1: 'Simvastatin', drug2: 'Erythromycin', severity: 'severe', effect: 'Increased risk of muscle toxicity', recommendation: 'Avoid or use lower statin dose' },
  { drug1: 'Metformin', drug2: 'Contrast Dye', severity: 'moderate', effect: 'Risk of lactic acidosis', recommendation: 'Temporarily stop metformin before contrast' },
  { drug1: 'Warfarin', drug2: 'Aspirin', severity: 'severe', effect: 'Increased bleeding risk', recommendation: 'Avoid combination unless specifically indicated' },
  { drug1: 'Lisinopril', drug2: 'Potassium', severity: 'moderate', effect: 'Hyperkalemia risk', recommendation: 'Monitor potassium levels' },
  { drug1: 'Furosemide', drug2: 'Gentamicin', severity: 'severe', effect: 'Increased ototoxicity', recommendation: 'Monitor hearing and kidney function' },
];

export function checkDrugInteraction(drug1: string, drug2: string): DrugInteraction | null {
  const d1 = drug1.toLowerCase();
  const d2 = drug2.toLowerCase();
  
  return knownInteractions.find(i => 
    (i.drug1.toLowerCase().includes(d1) || d1.includes(i.drug1.toLowerCase())) &&
    (i.drug2.toLowerCase().includes(d2) || d2.includes(i.drug2.toLowerCase()))
  ) || null;
}

export function checkMultipleDrugInteractions(medications: string[]): DrugInteraction[] {
  const interactions: DrugInteraction[] = [];
  
  for (let i = 0; i < medications.length; i++) {
    for (let j = i + 1; j < medications.length; j++) {
      const interaction = checkDrugInteraction(medications[i], medications[j]);
      if (interaction) {
        interactions.push(interaction);
      }
    }
  }
  
  return interactions;
}

export function checkAllergyConflict(medication: string, allergies: string[]): { conflict: boolean; allergy?: string } {
  const med = medication.toLowerCase();
  
  for (const allergy of allergies) {
    const a = allergy.toLowerCase();
    // Check for partial matches (e.g., "Penicillin" matches "Amoxicillin")
    if (med.includes(a) || a.includes(med)) {
      return { conflict: true, allergy };
    }
    
    // Common allergy categories
    const allergyCategories: Record<string, string[]> = {
      'penicillin': ['amoxicillin', 'ampicillin', 'penicillin', 'amoxil', 'clavulanate'],
      'sulfonamide': ['sulfamethoxazole', 'bactrim', 'septra', 'sulfonamide'],
      'NSAID': ['ibuprofen', 'naproxen', 'aspirin', 'diclofenac', 'meloxicam'],
      'opioid': ['morphine', 'codeine', 'tramadol', 'oxycodone', 'hydrocodone'],
      'cephalosporin': ['cephalexin', 'ceftriaxone', 'cefazolin', 'cephalosporin'],
    };
    
    for (const [category, drugs] of Object.entries(allergyCategories)) {
      if (a === category || drugs.some(d => d === med)) {
        return { conflict: true, allergy: category };
      }
    }
  }
  
  return { conflict: false };
}

export function getAllergyWarning(medication: string, patientAllergies: string[]): string | null {
  const result = checkAllergyConflict(medication, patientAllergies);
  if (result.conflict) {
    return `⚠️ Patient is allergic to ${result.allergy}. Do not prescribe ${medication}.`;
  }
  return null;
}

// Interaction severity colors for UI
export const severityColors = {
  mild: 'bg-yellow-100 text-yellow-800',
  moderate: 'bg-orange-100 text-orange-800', 
  severe: 'bg-red-100 text-red-800',
};

export const severityIcons = {
  mild: '⚠️',
  moderate: '⚠️⚠️',
  severe: '🚨',
};