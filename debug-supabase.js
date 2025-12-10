import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aqhoqcyespikebuatbmp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxaG9xY3llc3Bpa2VidWF0Ym1wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2Mzg3ODksImV4cCI6MjA3OTIxNDc4OX0.YpzzzAwEewbwDihxZ9d-mTZJzoxN8mGQC-z_nd-ecUY';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debug() {
  console.log('=== DEBUGGING SUPABASE DATA ===\n');
  
  // Test insert into coin_transactions
  console.log('TEST INSERT INTO coin_transactions:');
  const { error: testTxError } = await supabase
    .from('coin_transactions')
    .insert({
      user_id: 999,
      amount: -1,
      type: 'test',
      description: 'Test insert',
    });
  
  if (testTxError) {
    console.log('INSERT ERROR:', testTxError.message);
    console.log('CODE:', testTxError.code);
  } else {
    console.log('INSERT SUCCESS!');
    // Clean up
    await supabase.from('coin_transactions').delete().eq('user_id', 999);
  }
  
  console.log('\n---\n');
  
  // Test insert into writer_earnings
  console.log('TEST INSERT INTO writer_earnings:');
  const { error: testEarnError } = await supabase
    .from('writer_earnings')
    .insert({
      writer_id: 999,
      novel_id: 1,
      chapter_id: 1,
      reader_id: 999,
      amount: 1,
      writer_share: 1,
      platform_share: 0,
    });
  
  if (testEarnError) {
    console.log('INSERT ERROR:', testEarnError.message);
    console.log('CODE:', testEarnError.code);
  } else {
    console.log('INSERT SUCCESS!');
    // Clean up
    await supabase.from('writer_earnings').delete().eq('writer_id', 999);
  }
  
  console.log('\n---\n');
  
  // Check if tables exist by trying to select
  console.log('CHECKING TABLES EXIST:');
  
  const tables = ['coin_transactions', 'writer_earnings', 'unlocked_chapters', 'users', 'novels', 'chapters'];
  for (const table of tables) {
    const { error } = await supabase.from(table).select('*').limit(1);
    console.log(`  ${table}: ${error ? 'ERROR - ' + error.message : 'EXISTS'}`);
  }
  
  console.log('\n---\n');
  
  // Check unlocked_chapters
  const { data: unlocked, error: unlockError } = await supabase
    .from('unlocked_chapters')
    .select('*')
    .order('unlocked_at', { ascending: false })
    .limit(20);
  
  console.log('UNLOCKED CHAPTERS:');
  if (unlockError) {
    console.log('Error:', unlockError.message);
  } else {
    console.log('Count:', unlocked?.length || 0);
    if (unlocked && unlocked.length > 0) {
      unlocked.forEach(u => {
        console.log(`  - User: ${u.user_id}, Chapter: ${u.chapter_id}, At: ${u.unlocked_at}`);
      });
    } else {
      console.log('  No unlocked chapters found!');
    }
  }
  
  console.log('\n---\n');
  
  // Check users with writer_balance > 0
  const { data: writers, error: writerError } = await supabase
    .from('users')
    .select('id, name, writer_balance, total_earnings')
    .gt('writer_balance', 0)
    .limit(10);
  
  console.log('USERS WITH WRITER BALANCE:');
  if (writerError) {
    console.log('Error:', writerError.message);
  } else {
    console.log('Count:', writers?.length || 0);
    if (writers && writers.length > 0) {
      writers.forEach(u => {
        console.log(`  - ID: ${u.id}, Name: ${u.name}, Balance: ${u.writer_balance}, Total: ${u.total_earnings}`);
      });
    }
  }
}

debug().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
