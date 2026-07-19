"use client";

import { useState } from "react";
import { RolePermissionMatrix } from "./RolePermissionMatrix";
import { RoleTable } from "./RoleTable";

export function RolesPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div>
      <RoleTable onChanged={() => setRefreshKey((k) => k + 1)} />
      <RolePermissionMatrix refreshKey={refreshKey} />
    </div>
  );
}
