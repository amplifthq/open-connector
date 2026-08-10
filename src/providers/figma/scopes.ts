export const figmaPublicOAuthScopes: string[] = [
  "current_user:read",
  "file_metadata:read",
  "file_content:read",
  "file_versions:read",
  "file_comments:read",
  "file_comments:write",
  "library_content:read",
  "library_assets:read",
  "file_dev_resources:read",
  "file_dev_resources:write",
];

export const figmaPersonalAccessTokenScopes: string[] = [
  ...figmaPublicOAuthScopes,
  "projects:read",
  "project_metadata:read",
];
