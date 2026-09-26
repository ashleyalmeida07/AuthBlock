const fs = require('fs');

const filesToProcess = [
  'src/app/admin/courses/page.tsx',
  'src/app/admin/degrees/page.tsx',
  'src/app/admin/marksheets/page.tsx',
  'src/app/admin/network/page.tsx',
  'src/app/admin/settings/page.tsx',
  'src/app/admin/users/page.tsx'
];

filesToProcess.forEach(filePath => {
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  content = content.replace(/bg-slate-50/g, 'bg-brand-bg');
  content = content.replace(/border-slate-200/g, 'border-brand-border');
  content = content.replace(/border-slate-100/g, 'border-brand-border/50');
  content = content.replace(/text-slate-900/g, 'text-brand-heading');
  content = content.replace(/text-slate-800/g, 'text-brand-heading');
  content = content.replace(/text-slate-700/g, 'text-brand-navy');
  content = content.replace(/text-slate-600/g, 'text-brand-navy/80');
  content = content.replace(/text-slate-500/g, 'text-brand-navy/60');
  content = content.replace(/text-slate-400/g, 'text-brand-navy/40');
  content = content.replace(/text-slate-300/g, 'text-brand-navy/30');
  content = content.replace(/text-blue-700/g, 'text-brand-bright');
  content = content.replace(/text-blue-600/g, 'text-brand-blue');
  content = content.replace(/bg-blue-600/g, 'bg-brand-blue');
  content = content.replace(/bg-blue-50\/80/g, 'bg-brand-soft');
  content = content.replace(/bg-blue-50/g, 'bg-brand-soft');
  content = content.replace(/shadow-blue-600\/20/g, 'shadow-blue-glow');
  content = content.replace(/border-blue-500/g, 'border-brand-blue');
  content = content.replace(/border-blue-600/g, 'border-brand-blue');
  
  // also fix table headers
  content = content.replace(/bg-slate-100/g, 'bg-brand-border/30');
  
  // input fields
  content = content.replace(/border-slate-300/g, 'border-brand-border');
  content = content.replace(/placeholder-slate-400/g, 'placeholder-brand-navy/30');
  
  // ring colors
  content = content.replace(/ring-blue-500/g, 'ring-brand-blue');
  content = content.replace(/focus:border-blue-500/g, 'focus:border-brand-blue');
  content = content.replace(/focus:ring-blue-500\/20/g, 'focus:ring-brand-blue/20');
  content = content.replace(/focus:ring-blue-500/g, 'focus:ring-brand-blue');
  
  fs.writeFileSync(filePath, content);
  console.log(`Updated ${filePath}`);
});
