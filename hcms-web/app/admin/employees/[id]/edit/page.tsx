'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import EmployeeForm from '@/components/employees/EmployeeForm';

export default function EditEmployeePage() {
  const params = useParams();
  const employeeId = params.id ? parseInt(params.id as string, 10) : undefined;

  return <EmployeeForm mode="edit" employeeId={employeeId} />;
}
