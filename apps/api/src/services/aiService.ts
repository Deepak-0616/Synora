import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/connection.js';
import { Bureau, ComplaintPriority } from '../types/index.js';
import { evaluateSLAStatus } from '../utils/sla.js';

export interface ClassificationResult {
  suggested_category: string;
  suggested_bureau_id: string | null;
  suggested_bureau_code: string | null;
  suggested_bureau_name: string | null;
  confidence: number;
  extracted_keywords: string[];
}

export interface DuplicateCandidate {
  id: string;
  reference_number: string;
  title: string;
  similarity: number; // 0.0 - 1.0
  status: string;
  created_at: string;
  match_reason: string;
}

export interface StructuredSummary {
  core_issue: string;
  claimed_impact: string;
  requested_redress: string;
}

export interface RiskAnalysisResult {
  urgency_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  risk_factors: string[];
  sla_status: 'NORMAL' | 'APPROACHING_DEADLINE' | 'OVERDUE';
  recommended_actions: string[];
}

export class AIService {
  /**
   * Suggests appropriate category and bureau using NLP pattern matching & keyword routing
   */
  public static async classifyComplaint(title: string, description: string): Promise<ClassificationResult> {
    const combinedText = `${title} ${description}`.toLowerCase();
    const bureaus = await db.query<Bureau>('SELECT * FROM bureaus WHERE is_active = 1;');

    let bestBureau: Bureau | null = null;
    let highestScore = 0;
    const foundKeywords: string[] = [];

    for (const bureau of bureaus) {
      if (!bureau.routing_keywords) continue;
      const keywords = bureau.routing_keywords.split(',').map(k => k.trim().toLowerCase());
      let matches = 0;

      for (const kw of keywords) {
        if (combinedText.includes(kw)) {
          matches++;
          if (!foundKeywords.includes(kw)) foundKeywords.push(kw);
        }
      }

      if (matches > highestScore) {
        highestScore = matches;
        bestBureau = bureau;
      }
    }

    // Determine category
    let suggestedCategory = 'General Administrative';
    if (combinedText.includes('ragging') || combinedText.includes('bullying') || combinedText.includes('hazing') || combinedText.includes('hostel abuse')) {
      suggestedCategory = 'Ragging / Harassment';
    } else if (combinedText.includes('fee') || combinedText.includes('capitation') || combinedText.includes('refund') || combinedText.includes('caution money')) {
      suggestedCategory = 'Fee & Financial Malpractice';
    } else if (combinedText.includes('admission') || combinedText.includes('intake') || combinedText.includes('quota') || combinedText.includes('counseling')) {
      suggestedCategory = 'Admission Irregularity';
    } else if (combinedText.includes('certificate') || combinedText.includes('mark sheet') || combinedText.includes('salary') || combinedText.includes('provident')) {
      suggestedCategory = 'Faculty & Staff Grievance';
    } else if (combinedText.includes('lab') || combinedText.includes('equipment') || combinedText.includes('fire') || combinedText.includes('building') || combinedText.includes('infrastructure')) {
      suggestedCategory = 'Infrastructure & Safety';
    } else if (combinedText.includes('approval') || combinedText.includes('eoa') || combinedText.includes('affiliation') || combinedText.includes('accreditation')) {
      suggestedCategory = 'Approval & Accreditation';
    }

    const confidence = Math.min(0.95, Math.max(0.45, 0.45 + (highestScore * 0.12)));

    return {
      suggested_category: suggestedCategory,
      suggested_bureau_id: bestBureau?.id || null,
      suggested_bureau_code: bestBureau?.code || null,
      suggested_bureau_name: bestBureau?.name || null,
      confidence: Number(confidence.toFixed(2)),
      extracted_keywords: foundKeywords.slice(0, 6)
    };
  }

  /**
   * Scans active complaints to identify potential duplicate submissions
   */
  public static async detectDuplicates(
    title: string,
    description: string,
    institutionName: string,
    excludeComplaintId?: string
  ): Promise<DuplicateCandidate[]> {
    const existing = await db.query<{
      id: string;
      reference_number: string;
      title: string;
      description: string;
      institution_name: string;
      status: string;
      created_at: string;
    }>(
      `SELECT id, reference_number, title, description, institution_name, status, created_at
       FROM complaints
       WHERE id != COALESCE(?, '')
       ORDER BY created_at DESC
       LIMIT 50;`,
      [excludeComplaintId || '']
    );

    const candidates: DuplicateCandidate[] = [];
    const targetWords = this.tokenize(`${title} ${description}`);
    const targetInst = institutionName.toLowerCase().trim();

    for (const comp of existing) {
      const compInst = comp.institution_name.toLowerCase().trim();
      const isSameInstitution = targetInst && compInst && (targetInst.includes(compInst) || compInst.includes(targetInst));

      const compWords = this.tokenize(`${comp.title} ${comp.description}`);
      const similarity = this.calculateJaccardSimilarity(targetWords, compWords);

      // Boost score if within same institution
      const adjustedSimilarity = isSameInstitution ? Math.min(1.0, similarity * 1.35 + 0.15) : similarity;

      if (adjustedSimilarity >= 0.35) {
        let matchReason = `Text overlap similarity: ${(adjustedSimilarity * 100).toFixed(0)}%`;
        if (isSameInstitution) {
          matchReason += ` across matching institution (${comp.institution_name})`;
        }

        candidates.push({
          id: comp.id,
          reference_number: comp.reference_number,
          title: comp.title,
          similarity: Number(adjustedSimilarity.toFixed(2)),
          status: comp.status,
          created_at: comp.created_at,
          match_reason: matchReason
        });
      }
    }

    return candidates.sort((a, b) => b.similarity - a.similarity).slice(0, 4);
  }

  /**
   * Generates a structured 3-part case summary
   */
  public static summarizeComplaint(title: string, description: string): StructuredSummary {
    const sentences = description.split(/[.!?]+/).map(s => s.trim()).filter(Boolean);

    const coreIssue = sentences[0]
      ? `${title}. ${sentences[0]}.`
      : title;

    const remainingSentences = sentences.slice(1);
    let claimedImpact = 'Operational or institutional non-compliance impacting students/faculty.';
    const impactSentence = remainingSentences.find(s =>
      /harass|affect|loss|delay|depriv|suffer|denied|withheld|injury|threat/i.test(s)
    ) || sentences.find(s => /harass|affect|loss|delay|depriv|suffer|denied|withheld|injury|threat/i.test(s));

    if (impactSentence) {
      claimedImpact = impactSentence;
    }

    let requestedRedress = 'Expedited verification and appropriate regulatory intervention by the competent AICTE Bureau.';
    const redressSentence = [...sentences].reverse().find(s =>
      /request|demand|seek|plead|appeal|action to|interven|redress|direct/i.test(s)
    );
    if (redressSentence) {
      requestedRedress = redressSentence;
    }

    return {
      core_issue: coreIssue,
      claimed_impact: claimedImpact,
      requested_redress: requestedRedress
    };
  }

  /**
   * Analyzes deadline risk factors and urgency
   */
  public static analyzeRisk(
    priority: ComplaintPriority,
    createdAt: string,
    targetDate: string,
    description: string
  ): RiskAnalysisResult {
    const sla = evaluateSLAStatus(targetDate, createdAt);
    const textLower = description.toLowerCase();

    const highUrgencyKeywords = ['urgent', 'emergency', 'immediate', 'threat', 'suicide', 'assault', 'violence', 'police', 'expulsion', 'tomorrow'];
    const matchedUrgency = highUrgencyKeywords.filter(k => textLower.includes(k));

    const riskFactors: string[] = [];
    if (sla.status === 'OVERDUE') {
      riskFactors.push(`SLA target breached by ${Math.abs(sla.hoursRemaining)} hours`);
    } else if (sla.status === 'APPROACHING_DEADLINE') {
      riskFactors.push(`Approaching target resolution deadline (${sla.hoursRemaining} hours remaining)`);
    }

    if (matchedUrgency.length > 0) {
      riskFactors.push(`High urgency terminology detected in complaint statement: [${matchedUrgency.join(', ')}]`);
    }

    if (priority === 'CRITICAL') {
      riskFactors.push('Assigned CRITICAL priority status (strict 48-hour protocol)');
    }

    const recommendedActions: string[] = [];
    if (sla.status === 'OVERDUE' || priority === 'CRITICAL') {
      recommendedActions.push('Initiate emergency supervisory escalation to Bureau Head');
      recommendedActions.push('Issue statutory notice to institutional Ombudsman');
    } else if (sla.status === 'APPROACHING_DEADLINE') {
      recommendedActions.push('Send priority alert reminder to assigned case officer');
    } else {
      recommendedActions.push('Proceed with scheduled investigation milestone');
    }

    let urgencyLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    if (priority === 'CRITICAL' || sla.status === 'OVERDUE' || matchedUrgency.length >= 2) {
      urgencyLevel = 'CRITICAL';
    } else if (priority === 'HIGH' || sla.status === 'APPROACHING_DEADLINE') {
      urgencyLevel = 'HIGH';
    } else if (priority === 'MEDIUM') {
      urgencyLevel = 'MEDIUM';
    }

    return {
      urgency_level: urgencyLevel,
      risk_factors: riskFactors,
      sla_status: sla.status,
      recommended_actions: recommendedActions
    };
  }

  private static tokenize(text: string): Set<string> {
    const stopWords = new Set(['the', 'and', 'for', 'are', 'was', 'this', 'that', 'with', 'from', 'have', 'been', 'institution', 'college', 'student', 'students']);
    const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 2 && !stopWords.has(w));
    return new Set(words);
  }

  private static calculateJaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
    if (setA.size === 0 || setB.size === 0) return 0;
    let intersection = 0;
    for (const item of setA) {
      if (setB.has(item)) intersection++;
    }
    const union = setA.size + setB.size - intersection;
    return union === 0 ? 0 : intersection / union;
  }
}
