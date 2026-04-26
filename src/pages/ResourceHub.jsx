import React from 'react';
import { useStore } from '../store/useStore';
import { Folder, Link, FileText, Lock, Plus, ExternalLink, Download } from 'lucide-react';

export default function ResourceHub() {
  const { activeTeamId, teams } = useStore();
  const team = teams.find(t => t.id === activeTeamId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Resource Hub</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Important links and files for {team ? team.name : 'the team'}.
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm">
          <Plus size={16} />
          <span>Add Resource</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Category: Links */}
        <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 bg-slate-50 dark:bg-slate-900">
            <Link size={18} className="text-blue-500" />
            <h3 className="font-semibold">Important Links</h3>
          </div>
          <div className="p-4 space-y-3 flex-1">
            {[
              { name: 'Figma Design System', url: 'figma.com' },
              { name: 'Production Dashboard', url: 'vercel.com' },
              { name: 'API Documentation', url: 'swagger.io' },
            ].map(link => (
              <div key={link.name} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-blue-500/50 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors group cursor-pointer">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">{link.name}</span>
                <ExternalLink size={14} className="text-slate-400 group-hover:text-blue-500" />
              </div>
            ))}
          </div>
        </div>

        {/* Category: Documents */}
        <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 bg-slate-50 dark:bg-slate-900">
            <FileText size={18} className="text-green-500" />
            <h3 className="font-semibold">Documents</h3>
          </div>
          <div className="p-4 space-y-3 flex-1">
            {[
              { name: 'Q3 OKRs.pdf', size: '2.4 MB' },
              { name: 'Brand Guidelines.pdf', size: '15 MB' },
              { name: 'Employee Handbook.docx', size: '1.2 MB' },
            ].map(doc => (
              <div key={doc.name} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-green-500/50 hover:bg-green-50/50 dark:hover:bg-green-900/10 transition-colors group cursor-pointer">
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-green-600 dark:group-hover:text-green-400">{doc.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{doc.size}</p>
                </div>
                <Download size={14} className="text-slate-400 group-hover:text-green-500" />
              </div>
            ))}
          </div>
        </div>

        {/* Category: Credentials */}
        <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 bg-slate-50 dark:bg-slate-900">
            <Lock size={18} className="text-yellow-500" />
            <h3 className="font-semibold">Credentials & Snippets</h3>
          </div>
          <div className="p-4 space-y-3 flex-1">
            {[
              { name: 'Staging Database URL', type: 'Secret' },
              { name: 'AWS S3 Bucket Name', type: 'Text' },
              { name: 'Guest Wi-Fi Password', type: 'Secret' },
            ].map(cred => (
              <div key={cred.name} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-yellow-500/50 hover:bg-yellow-50/50 dark:hover:bg-yellow-900/10 transition-colors group cursor-pointer">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-yellow-600 dark:group-hover:text-yellow-400">{cred.name}</span>
                <span className="text-[10px] uppercase font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-500 group-hover:bg-yellow-100 dark:group-hover:bg-yellow-900/30 group-hover:text-yellow-700 dark:group-hover:text-yellow-500">
                  {cred.type}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
