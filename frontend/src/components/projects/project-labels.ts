import type { Project } from "@/types";

export const projectStatuses = { planning: "Planning", in_progress: "In progress", completed: "Completed", on_hold: "On hold" };
export const evidenceTypes = { proposal: "Funding proposal", plan: "Implementation plan", research: "Research report" };
export function evidenceLabel(project: Project) {
    return project.evidence_type ? evidenceTypes[project.evidence_type] : projectStatuses[project.status];
}
