export const patsnapMcpOrigin = "https://connect.patsnap.com";
export const patsnapServerNames = ["core_patents", "patent_landscape", "design_infringement"] as const;
export type PatsnapServer = (typeof patsnapServerNames)[number];
export const patsnapMcpEndpoints: Record<PatsnapServer, string> = {
  core_patents: `${patsnapMcpOrigin}/1458a4/mcp`,
  patent_landscape: `${patsnapMcpOrigin}/59100a/mcp`,
  design_infringement: `${patsnapMcpOrigin}/937ec6/mcp`,
};
