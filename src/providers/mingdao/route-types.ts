export interface MingdaoRoute {
  method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  path: string;
  retainPathFields?: readonly string[];
  noBody?: boolean;
  bodyField?: string;
  successCodes?: readonly number[];
}
