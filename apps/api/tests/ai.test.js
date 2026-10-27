import { describe, it, expect, beforeAll } from "vitest";
import { runMigrations } from "../src/db/migrate.js";
import { seedDatabase } from "../src/db/seed.js";
import { AIService } from "../src/services/aiService.js";
describe("AI-Assisted Capabilities", () => {
  beforeAll(async () => {
    await runMigrations();
    await seedDatabase(false);
  });
  it("correctly classifies an Anti-Ragging grievance with high confidence", async () => {
    const title = "Physical hazing in college dormitory";
    const description = "Senior students are harassing first year hostel students late at night with verbal threats and assault.";
    const result = await AIService.classifyComplaint(title, description);
    expect(result.suggested_category).toBe("Ragging / Harassment");
    expect(result.suggested_bureau_code).toBe("ARC");
    expect(result.confidence).toBeGreaterThanOrEqual(0.6);
  });
  it("correctly classifies a Fee capitation complaint", async () => {
    const title = "Demanding illegal cash payment for admission";
    const description = "College is asking for a mandatory capitation fee of two lakhs and refusing refund upon seat cancellation.";
    const result = await AIService.classifyComplaint(title, description);
    expect(result.suggested_category).toBe("Fee & Financial Malpractice");
    expect(result.confidence).toBeGreaterThanOrEqual(0.5);
  });
  it("generates a structured 3-part summary with core issue, impact, and redress", () => {
    const title = "Withholding original 12th mark sheet";
    const description = "The administration denied returning my original certificates when I withdrew. This delay affected my ability to join another approved university. I request urgent action to return my documents.";
    const summary = AIService.summarizeComplaint(title, description);
    expect(summary.core_issue).toContain("Withholding");
    expect(summary.claimed_impact).toContain("delay affected");
    expect(summary.requested_redress).toContain("request");
  });
  it("detects duplicate complaints based on text and institution overlap", async () => {
    const title = "Hazing and harassment in hostel";
    const description = "Hostel students subjected to forced tasks and harassment at night by senior boys.";
    const institution = "Apex Institute of Engineering & Technology, Bengaluru";
    const duplicates = await AIService.detectDuplicates(title, description, institution);
    expect(duplicates.length).toBeGreaterThan(0);
    expect(duplicates[0].reference_number).toBe("SYN-2026-00101");
    expect(duplicates[0].similarity).toBeGreaterThan(0.35);
  });
});
