const data = require('../filter-test-results.json');
let hasTitle = 0, hasCompany = 0, hasBoth = 0;
const missing = [];
for (const r of data.results) {
  const t = r.job_title && r.job_title !== 'Unknown' && r.job_title !== 'Not specified';
  const c = r.company && r.company !== 'Unknown' && r.company !== 'Not specified';
  if (t) hasTitle++;
  if (c) hasCompany++;
  if (t && c) hasBoth++;
  if (!c) missing.push(r);
}
console.log('Total:', data.results.length);
console.log('Has job title:', hasTitle, '(' + ((hasTitle/data.results.length)*100).toFixed(0) + '%)');
console.log('Has company:', hasCompany, '(' + ((hasCompany/data.results.length)*100).toFixed(0) + '%)');
console.log('Has both:', hasBoth, '(' + ((hasBoth/data.results.length)*100).toFixed(0) + '%)');
console.log('');
console.log('Missing company:');
missing.forEach(r => console.log('  #' + r.index, r.job_title, '@', r.company));
