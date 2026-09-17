'use client';

import React from 'react';
import { Users, Search, Mail, Phone, MapPin, Building2, HardHat, Award } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/PageHeader';

export default function MssTeamPage() {
  const teamMembers = [
    {
      id: 1,
      name: 'Rian Hidayat',
      nik: 'HRS-98124',
      position: 'Operator Excavator PC-400',
      grade: 'Grade 3B',
      status: 'AKTIF',
      site: 'Site Rantau (B4)',
      shift: 'Shift 1 (Pagi)',
      simper: 'SIMPER Valid s/d 2027',
      phone: '0813-8841-0021',
    },
    {
      id: 2,
      name: 'Doni Firmansyah',
      nik: 'HRS-99105',
      position: 'Drilling & Blasting Crew',
      grade: 'Grade 3A',
      status: 'AKTIF',
      site: 'Site Rantau (B4)',
      shift: 'Shift 1 (Pagi)',
      simper: 'KJL Class II Active',
      phone: '0852-9912-4410',
    },
    {
      id: 3,
      name: 'Syaiful Anwar',
      nik: 'HRS-97330',
      position: 'Pit Surveyor',
      grade: 'Grade 4A',
      status: 'AKTIF',
      site: 'Site Rantau (B4)',
      shift: 'Shift 1 (Pagi)',
      simper: 'SIMPER LV + Drone Pilot',
      phone: '0812-4411-8890',
    },
    {
      id: 4,
      name: 'Hendra Wijaya',
      nik: 'HRS-99042',
      position: 'Mekanik Heavy Equipment',
      grade: 'Grade 3C',
      status: 'OFF_ROSTER',
      site: 'Site Rantau (B4)',
      shift: 'Off Roster (Balik Site 18 Sep)',
      simper: 'SIMPER Heavy Support',
      phone: '0821-5510-3329',
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Direktori Tim Bawahan (Team Hub)"
        subtitle="Daftar personel di bawah garis pengawasan Anda, status penugasan shift tambang, dan verifikasi sertifikat keselamatan"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {teamMembers.map((member) => (
          <Card key={member.id} className="p-5 border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-700 font-bold text-lg dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                  {member.name.charAt(0)}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{member.name}</h4>
                  <p className="text-xs text-slate-500 font-mono">NIK: {member.nik} • {member.grade}</p>
                </div>
              </div>
              {member.status === 'AKTIF' ? (
                <Badge variant="success" className="text-[10px]">On Duty</Badge>
              ) : (
                <Badge variant="neutral" className="text-[10px]">Off Roster</Badge>
              )}
            </div>

            <div className="rounded-lg bg-slate-50 p-3 text-xs space-y-1.5 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400">
              <div className="flex justify-between">
                <span className="text-slate-400">Posisi:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{member.position}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Jadwal Shift:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{member.shift}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Sertifikasi / SIMPER:</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400">{member.simper}</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span>{member.site}</span>
              <span className="font-mono">{member.phone}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
