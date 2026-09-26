'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import RoleForm from '@/components/roles/RoleForm';

export default function EditRolePage() {
  const params = useParams();
  const roleId = params.id ? parseInt(params.id as string, 10) : undefined;

  return <RoleForm mode="edit" roleId={roleId} />;
}
