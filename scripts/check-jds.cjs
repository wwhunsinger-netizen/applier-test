const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  // Check display_jobs
  const { count: djCount } = await sb.from('display_jobs').select('id', { count: 'exact', head: true });
  console.log('display_jobs count:', djCount);
  const { data: djSample } = await sb.from('display_jobs').select('*').limit(1);
  if (djSample && djSample[0]) {
    console.log('display_jobs columns:', Object.keys(djSample[0]).join(', '));
    const desc = djSample[0].description || djSample[0].job_description || '';
    console.log('has description:', desc.length > 0, 'length:', desc.length);
  }

  // Check feed_jobs
  const { count: fjCount } = await sb.from('feed_jobs').select('id', { count: 'exact', head: true });
  console.log('\nfeed_jobs count:', fjCount);
  const { data: fjSample } = await sb.from('feed_jobs').select('*').limit(1);
  if (fjSample && fjSample[0]) {
    console.log('feed_jobs columns:', Object.keys(fjSample[0]).join(', '));
    const desc = fjSample[0].description || fjSample[0].job_description || '';
    console.log('has description:', desc.length > 0, 'length:', desc.length);
  }
})();
